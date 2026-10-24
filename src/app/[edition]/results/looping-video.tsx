"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

// A muted, looping, control-less video that behaves like a GIF - but unlike a plain autoPlay video
// it doesn't fetch anything until the reader scrolls near it, and it pauses while off screen. It sits
// at the very bottom of a long page, so most visits would otherwise download the whole file for
// nothing.
export default function LoopingVideo({ src, className, style }: { src: string; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      // Start loading a screen and a half early, so it's already playing by the time it's in view.
      { rootMargin: "150% 0px" }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={near ? src : undefined}
      autoPlay
      muted
      loop
      playsInline
      disablePictureInPicture
      preload="none"
      aria-hidden="true"
      className={className}
      style={style}
    />
  );
}
