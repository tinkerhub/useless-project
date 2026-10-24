"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_INTERVAL_MS = 220;

// Cycles through `frames` on hover (mouse enter starts it, mouse leave resets to frame 0) -
// a much smaller version of the homepage's AnimatedElephant burst scheduler, since this only
// ever needs to run while the pointer is actually over it, not on an autonomous timer.
export default function HoverFrames({
  frames,
  className,
}: {
  frames: string[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % frames.length);
    }, FRAME_INTERVAL_MS);
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIndex(0);
  };

  useEffect(() => () => stop(), []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={frames[index]}
      alt=""
      aria-hidden="true"
      className={className}
      onMouseEnter={start}
      onMouseLeave={stop}
    />
  );
}
