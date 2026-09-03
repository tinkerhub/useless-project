"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const EMBED_SCRIPT_SRC = "https://www.instagram.com/embed.js";
const NATIVE_WIDTH = 328;

// Instagram's oEmbed widget only rewrites <blockquote class="instagram-media"> tags into the
// actual player when window.instgrm.Embeds.process() runs, so the script has to be (re)triggered
// on every mount rather than just loaded once.
// How long to wait for Instagram's iframe to actually resize (via ResizeObserver) before giving
// up and showing a plain link instead. A blank <blockquote> has no fallback content of its own -
// unlike Instagram's real oEmbed HTML, ours never fetches that - so a post that embed.js can't
// process (deleted, private, blocked script, flaky network) would otherwise just render nothing.
const EMBED_TIMEOUT_MS = 6000;

export default function InstagramEmbed({ permalink, scale = 1 }: { permalink: string; scale?: number }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [nativeHeight, setNativeHeight] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const process = () => window.instgrm?.Embeds.process();

    if (window.instgrm) {
      process();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${EMBED_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", process);
      } else {
        const script = document.createElement("script");
        script.src = EMBED_SCRIPT_SRC;
        script.async = true;
        script.addEventListener("load", process);
        document.body.appendChild(script);
      }
    }

    const timeout = setTimeout(() => setTimedOut(true), EMBED_TIMEOUT_MS);

    // Instagram resizes its iframe to the post's real height asynchronously (via postMessage)
    // well after embed.js loads, so a ResizeObserver on the unscaled wrapper is the only reliable
    // way to know the true height to reserve once we're visually shrinking it with a CSS transform.
    const el = innerRef.current;
    if (!el) return () => clearTimeout(timeout);
    const observer = new ResizeObserver(([entry]) => setNativeHeight(entry.contentRect.height));
    observer.observe(el);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [permalink]);

  if (timedOut && !nativeHeight) {
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

  return (
    <div
      style={{
        width: NATIVE_WIDTH * scale,
        height: nativeHeight ? nativeHeight * scale : undefined,
        overflow: "hidden",
      }}
    >
      <div
        ref={innerRef}
        style={{ width: NATIVE_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {/* Instagram's non-captioned embed variant (omitting data-instgrm-captioned) never resizes
            past a 2px-tall iframe - it appears to be broken/deprecated on their end - so the
            captioned card is the only variant that actually renders and plays. */}
        <blockquote
          className="instagram-media"
          data-instgrm-captioned
          data-instgrm-permalink={permalink}
          data-instgrm-version="14"
          style={{ background: "#FFF", border: 0, margin: 0, padding: 0, width: "100%" }}
        />
      </div>
    </div>
  );
}
