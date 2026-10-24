"use client";

import { useEffect, useRef, useState } from "react";

// The results page's one "how to claim?" - a small black note tucked into the bottom-left corner,
// mostly below the edge of the screen so only its "how to claim?" header peeks out. Hovering slides
// the whole note up into view; on a phone (no hover) a tap does the same, and a tap anywhere else or
// Escape tucks it back. Hidden on phones, where the corner is tight - there the floating pet answers
// "how to claim?" when tapped instead.
export default function ClaimHint() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label="How to claim: winners will get an email with everything they need to claim their prize."
      aria-expanded={open}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((o) => !o);
        }
      }}
      // The peek is 30px of the note on a phone (40px from sm up) - the 16px below the edge is added on; hover or `open` lifts it fully into view, with a small
      // gap off the bottom edge.
      // Anchored 16px below the screen edge (with matching extra padding inside), so even tilted and
      // fully open its bottom runs off the screen instead of leaving a sliver of page under it.
      className={`group fixed -bottom-4 left-2 z-50 hidden sm:block w-[150px] cursor-pointer outline-none transition-transform duration-300 ease-out sm:left-8 sm:w-[210px] ${
        open ? "translate-y-0" : "translate-y-[calc(100%-46px)] hover:translate-y-0 sm:translate-y-[calc(100%-56px)]"
      }`}
    >
      {/* Black like the "menu" pill in the opposite corner, so the two read as the page's controls. */}
      <div className="rotate-[-3deg] rounded-t-xl bg-[#0e0e0d] px-3 pt-2 pb-7 text-left sm:rounded-t-2xl sm:px-4 sm:pt-3 sm:pb-9 shadow-[0_-4px_18px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:rotate-0">
        <p className="font-helvetica flex items-center justify-between text-[9px] font-bold tracking-[0.06em] text-white uppercase sm:text-[11px]">
          how to claim?
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`size-3 transition-transform sm:size-3.5 duration-300 group-hover:rotate-180 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="m6 15 6-6 6 6" />
          </svg>
        </p>
        <p className="font-nanum-pen mt-1 text-[15px] leading-[1.15] text-white/75 sm:mt-1.5 sm:text-[19px]">
          winners will get an email with everything they need to claim their prize.
        </p>
      </div>
    </div>
  );
}
