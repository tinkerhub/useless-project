"use client";

import { useEffect, useRef, useState } from "react";

const NATIVE_WIDTH = 328;
// A reasonable guess for a captioned post before Instagram tells us its real height - close
// enough that the fallback link (see below) rarely has to kick in just because a post is a bit
// taller or shorter than average.
const FALLBACK_HEIGHT = 480;

// How long to wait for Instagram's iframe to report its real size before giving up and showing a
// plain link instead - a post the iframe can't render (deleted, private, blocked, flaky network)
// would otherwise just sit there at FALLBACK_HEIGHT with nothing in it.
const EMBED_TIMEOUT_MS = 6000;

// Instagram's embed doesn't stop re-measuring once the post itself has loaded - the follow
// button, a "more" caption toggle, and related-post chrome each shift its internal layout and
// fire their own MEASURE message, spaced anywhere from tens of ms to a couple of seconds apart.
// Debouncing near-simultaneous messages (below) smooths a single burst, but doesn't stop this:
// each of those later, separately-timed messages still lands and resizes the card again. Locking
// height changes to a window after the *first* measurement stops that follow-on drift instead of
// reacting to it for as long as the tab stays open.
const SETTLE_WINDOW_MS = 2500;

// Instagram's own oEmbed API (api.instagram.com/oembed, which the old <blockquote class=
// "instagram-media"> + embed.js technique calls behind the scenes) has redirected instead of
// returning embed data since Meta locked public oEmbed access down in 2020 - that technique can
// no longer work for anyone, on any site, not just this one. Their embed *page* is still public
// and unauthenticated, though (https://www.instagram.com/p/<shortcode>/embed/captioned/) - this
// embeds that directly in an iframe instead, no dead API in the loop.
function embedSrc(permalink: string): string | null {
  try {
    const { pathname } = new URL(permalink);
    const match = pathname.match(/^\/(p|reel|tv)\/([^/]+)/);
    if (!match) return null;
    return `https://www.instagram.com/${match[1]}/${match[2]}/embed/captioned/`;
  } catch {
    return null;
  }
}

export default function InstagramEmbed({ permalink, scale = 1 }: { permalink: string; scale?: number }) {
  const src = embedSrc(permalink);
  const [height, setHeight] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  // Instagram doesn't post one final MEASURE message - it re-measures as the embed's own images
  // and fonts load in, each one nudging the height a few px either way. Applying every one of
  // those directly is what reads as glitchy (the card visibly resizing several times in a row);
  // debouncing to the last message in a burst, then only committing a change big enough to matter,
  // cuts that down to a single settle instead of a series of jumps.
  const settleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set the moment the first MEASURE arrives - not at mount - so a slow network doesn't eat into
  // the settle window before there's even a height to refine.
  const settleDeadline = useRef<number | null>(null);

  useEffect(() => {
    if (!src) return;

    // There's no way to read a cross-origin iframe's content size directly - Instagram's embed
    // page posts its real height back via window.postMessage once it finishes rendering (the same
    // protocol their own embed.js listens for), so this listens for it instead of using that script.
    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.instagram.com") return;
      let data: unknown;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!data || typeof data !== "object") return;
      const { type, details } = data as Record<string, unknown>;
      if (type === "MEASURE" && details && typeof details === "object") {
        const measuredHeight = (details as Record<string, unknown>).height;
        if (typeof measuredHeight !== "number") return;
        if (settleDeadline.current === null) settleDeadline.current = Date.now() + SETTLE_WINDOW_MS;
        if (Date.now() > settleDeadline.current) return;
        if (settleTimeout.current) clearTimeout(settleTimeout.current);
        settleTimeout.current = setTimeout(() => {
          setHeight((prev) => (prev !== null && Math.abs(prev - measuredHeight) < 4 ? prev : measuredHeight));
        }, 120);
      }
    }

    window.addEventListener("message", handleMessage);
    const timeout = setTimeout(() => setTimedOut(true), EMBED_TIMEOUT_MS);
    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timeout);
      if (settleTimeout.current) clearTimeout(settleTimeout.current);
    };
  }, [src]);

  if (!src || (timedOut && !height)) {
    return (
      <a
        href={permalink}
        target="_blank"
        rel="noreferrer"
        className="font-helvetica flex items-center justify-center rounded-xl border border-black/10 bg-black/[0.02] text-center text-[13px] text-[#ea34df] underline decoration-[#ea34df] decoration-2 underline-offset-4"
        style={{ width: NATIVE_WIDTH * scale, height: 120 }}
      >
        view on instagram
      </a>
    );
  }

  const displayHeight = height ?? FALLBACK_HEIGHT;

  return (
    <div
      style={{
        width: NATIVE_WIDTH * scale,
        height: displayHeight * scale,
        overflow: "hidden",
        transition: "height 200ms ease-out",
      }}
    >
      <iframe
        src={src}
        title="Instagram post"
        scrolling="no"
        style={{ width: NATIVE_WIDTH, height: displayHeight, border: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}
      />
    </div>
  );
}
