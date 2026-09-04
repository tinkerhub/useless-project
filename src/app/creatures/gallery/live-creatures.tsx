"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { PublicCreature } from "@/lib/creatures";

const PollContext = createContext<PublicCreature[]>([]);

// There's no persistent connection here (Netlify's Functions are request/response, not
// long-lived sockets), so "live" is approximated with a short poll rather than true push. This
// was 4s, but the gallery is also what the QR banner points a venue's own display at - several
// of those left open for hours during the hackathon adds up fast at that rate. 20s still reads as
// "live" for a gallery that isn't changing second-to-second, at a fifth of the request volume.
const POLL_INTERVAL_MS = 20000;

// Shared by GalleryCount and LiveCreatureSwarm so the gallery only opens one polling loop, not
// one per consumer - both just read whatever this provider last fetched.
export function LiveCreaturesProvider({
  initialCreatures,
  children,
}: {
  initialCreatures: PublicCreature[];
  children: ReactNode;
}) {
  const [creatures, setCreatures] = useState(initialCreatures);
  const inFlight = useRef(false);

  const poll = useCallback(async () => {
    // Skip while the tab is backgrounded, and skip overlapping requests if one is already out -
    // no point spending a function invocation refreshing a gallery nobody is looking at.
    if (document.visibilityState !== "visible" || inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/creatures/list", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.creatures)) setCreatures(data.creatures);
      }
    } catch {
      // A missed poll just leaves the gallery as-is until the next one - nothing to surface.
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const id = setInterval(poll, POLL_INTERVAL_MS);
    // Also poll the moment the tab comes back into focus, so returning from a backgrounded tab
    // doesn't sit on stale data for up to a full interval.
    document.addEventListener("visibilitychange", poll);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [poll]);

  return <PollContext.Provider value={creatures}>{children}</PollContext.Provider>;
}

export function useLiveCreatures() {
  return useContext(PollContext);
}
