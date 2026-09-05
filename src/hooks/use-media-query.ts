"use client";

import { useSyncExternalStore } from "react";

// useSyncExternalStore rather than useState+useEffect - matchMedia is exactly the kind of external
// mutable source it's meant for, and unlike an effect it has a real answer for the server snapshot
// (false: there's no viewport to check, so this never guesses true and risks mounting something
// heavy on mobile because of it) instead of an initial guess that a later effect corrects.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
