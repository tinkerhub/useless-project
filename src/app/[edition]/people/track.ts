import { useEffect, useSyncExternalStore } from "react";
import type { PeopleEvent } from "@/lib/people-events";

// The page's running totals (games played, photos taken...), fetched once and then bumped right
// here whenever this visitor does one of those things, so the number moves the moment they play.
type Totals = Partial<Record<PeopleEvent, number>>;
let totals: Totals | null = null;
let fetching = false;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((listen) => listen());

function loadTotals() {
  if (fetching) return;
  fetching = true;
  fetch("/api/people/counts")
    .then((res) => res.json())
    .then((data: { totals?: Totals }) => {
      // Keep any bumps made while it was loading on top of the fetched numbers.
      const bumps = totals ?? {};
      totals = { ...data.totals };
      for (const [event, n] of Object.entries(bumps) as [PeopleEvent, number][]) totals[event] = (totals[event] ?? 0) + n;
      changed();
    })
    .catch(() => {});
}

// One total, or null until it has loaded (show nothing rather than a 0 that is not true).
export function usePeopleTotal(event: PeopleEvent): number | null {
  useEffect(loadTotals, []);
  return useSyncExternalStore(
    (listen) => {
      listeners.add(listen);
      return () => listeners.delete(listen);
    },
    () => (totals && event in totals ? (totals[event] ?? null) : null),
    () => null,
  );
}

// Counts a person, once per browser (a flag in localStorage remembers they were counted), so the
// page can say how many people played rather than how many games were played.
export function trackOnce(event: PeopleEvent) {
  const flag = `ulp-counted-${event}`;
  try {
    if (localStorage.getItem(flag)) return;
    localStorage.setItem(flag, "1");
  } catch {
    // No storage (a private window): count them anyway rather than not at all.
  }
  track(event);
}

// Counts one thing someone did on the people page (see lib/people-stats.ts). Sent as a beacon, so it
// never holds anything up and still goes out if the page is being closed.
export function track(event: PeopleEvent) {
  totals = { ...totals, [event]: (totals?.[event] ?? 0) + 1 };
  changed();
  try {
    const body = JSON.stringify({ event });
    if (navigator.sendBeacon?.("/api/people/event", body)) return;
    void fetch("/api/people/event", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {
    // Counting is never worth breaking the page over.
  }
}
