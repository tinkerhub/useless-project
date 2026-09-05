"use client";

import type { ReactNode } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

// For content that's already CSS-hidden below `lg` (matching Tailwind's default 1024px
// breakpoint) but expensive enough that "hidden" isn't good enough on its own - a display:none
// element still has its <img> tags (and everything else) fetched and mounted, so a mobile visitor
// pays for it in bandwidth and battery without ever seeing it. This skips mounting children
// entirely below that breakpoint instead. Starts unmounted everywhere (including real desktop,
// until the client-side media query check runs just after hydration) rather than guessing true on
// the server, where there's no viewport to check.
export default function DesktopOnly({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  return isDesktop ? <>{children}</> : null;
}
