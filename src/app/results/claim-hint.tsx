"use client";

import { useEffect, useId, useRef, useState } from "react";

// A small "how to claim?" pill that answers itself in a little bubble. Hovering with a mouse shows
// it; a click or tap pins it open (another tap, a tap anywhere else, or Escape unpins it), so it
// works the same on a phone as on a laptop. Hover and pin are tracked separately so a click never
// fights the hover that came just before it. The pill fills pink whenever the bubble is showing.
export default function ClaimHint({ className = "" }: { className?: string }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const ref = useRef<HTMLSpanElement>(null);
  const bubbleId = useId();

  useEffect(() => {
    if (!pinned) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPinned(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinned(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pinned]);

  return (
    <span
      ref={ref}
      className={`relative inline-flex ${className}`}
      // Hover only for a real mouse - a tap fires pointerenter too, and should go through onClick.
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bubbleId}
        onClick={() => setPinned((p) => !p)}
        className={`font-helvetica inline-flex cursor-pointer items-center rounded-full border border-[#ea34df] px-3.5 py-1 text-[11px] font-bold tracking-[0.05em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea34df] ${
          open ? "bg-[#ea34df] text-white" : "bg-white text-[#ea34df]"
        }`}
      >
        how to claim?
      </button>
      <span
        id={bubbleId}
        role="tooltip"
        className={`pointer-events-none absolute top-[calc(100%+12px)] left-1/2 z-40 w-[230px] -translate-x-1/2 rounded-2xl bg-white px-4 py-3 text-center shadow-[0_6px_24px_rgba(0,0,0,0.14)] ring-1 ring-black/5 transition-[opacity,translate] duration-150 ${
          open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
        }`}
      >
        {/* The pointer: a small rotated square peeking out of the bubble's top edge. */}
        <span className="absolute top-0 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-white ring-1 ring-black/5 [clip-path:polygon(0_0,100%_0,0_100%)]" />
        <span className="font-nanum-pen relative block text-[18px] leading-[1.15] text-[#0e0e0d] normal-case">
          winners will get an email with everything they need to claim their prize.
        </span>
      </span>
    </span>
  );
}
