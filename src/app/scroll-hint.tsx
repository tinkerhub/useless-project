"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// A small "scroll" nudge at the bottom of the screen, on every page that has more below the fold.
// It waits a moment (so it does not flash over the splash or a page still settling), only shows
// while the page is still at the top, and goes for good on that page as soon as it is scrolled.
const SHOW_AFTER_MS = 3000;
// The people page has its own nudge ("scroll for the story"), timed around its game.
const OWN_HINT = /\/people$/;

export default function ScrollHint() {
  const pathname = usePathname();
  // The page it is showing on, so it is gone the moment you move to another.
  const [shownOn, setShownOn] = useState<string | null>(null);
  const show = shownOn === pathname;

  useEffect(() => {
    if (OWN_HINT.test(pathname)) return;
    let scrolled = false;
    const onScroll = () => {
      if (window.scrollY < 40) return;
      scrolled = true;
      setShownOn(null);
    };
    const t = setTimeout(() => {
      const more = document.documentElement.scrollHeight - window.innerHeight > 200;
      if (!scrolled && more && window.scrollY < 40) setShownOn(pathname);
    }, SHOW_AFTER_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      setShownOn(null);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-1 bg-[#0e0e0d] py-1 pr-2 pl-3 text-white shadow-[0_6px_16px_rgba(0,0,0,0.18)] transition-opacity duration-500 md:bottom-7 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="font-nanum-pen text-[20px] leading-none md:text-[22px]">scroll</span>
      <svg viewBox="0 0 24 24" className="size-5 motion-safe:animate-bounce" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="square">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
