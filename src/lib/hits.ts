// A rough traffic counter, not an analytics platform - it exists to answer "roughly how many
// times has the gallery poll actually reached the server in the last while," nothing more.
//
// It only increments from inside /api/creatures/list's own handler (see route.ts), which is
// already invoked on every poll regardless - so this adds one extra blob read/write to a request
// that was happening anyway, rather than adding a new hit anywhere. Deliberately NOT wired into
// every route or a global middleware: doing that would turn every free, CDN-cached static hit
// back into a function invocation just to count it, which defeats the entire point of caching
// the poll response in the first place. Because of that same caching, this also undercounts real
// visitor traffic - it counts origin invocations, i.e. roughly "one per cache window shared by
// however many tabs were open," not one per browser. That's the tradeoff for it costing ~nothing.
import { getStore } from "@netlify/blobs";

const STORE_NAME = "site-hits";
const KEY = "hourly";
const MAX_HOURS_KEPT = 24 * 14; // two weeks of hourly buckets - enough for a "last few days" view

function hourBucket(date: Date): string {
  return date.toISOString().slice(0, 13); // "2026-09-06T14"
}

function tryStore() {
  try {
    return getStore(STORE_NAME);
  } catch {
    return null;
  }
}

// Best-effort, fire-and-forget from the caller's point of view: a lost increment under a race
// between two near-simultaneous invocations just undercounts by one, which is fine for a rough
// counter - not worth the retry-loop complexity `creatures.ts` uses for data that actually matters.
export async function recordHit(): Promise<void> {
  const store = tryStore();
  if (!store) return;
  try {
    const existing = (await store.get(KEY, { type: "json" })) as Record<string, number> | null;
    const buckets = existing ?? {};
    const bucket = hourBucket(new Date());
    buckets[bucket] = (buckets[bucket] ?? 0) + 1;

    const keys = Object.keys(buckets).sort();
    if (keys.length > MAX_HOURS_KEPT) {
      for (const staleKey of keys.slice(0, keys.length - MAX_HOURS_KEPT)) delete buckets[staleKey];
    }

    await store.setJSON(KEY, buckets);
  } catch {
    // A missed count isn't worth failing the actual response over.
  }
}

export type HitReport = {
  hourly: { hour: string; count: number }[];
  daily: { day: string; count: number }[];
  totalLast24h: number;
  totalLast7d: number;
};

export async function getHitReport(): Promise<HitReport> {
  const store = tryStore();
  const buckets = store ? (((await store.get(KEY, { type: "json" })) as Record<string, number> | null) ?? {}) : {};

  const hourly = Object.entries(buckets)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => (a.hour < b.hour ? 1 : -1));

  const daily = new Map<string, number>();
  for (const { hour, count } of hourly) {
    const day = hour.slice(0, 10);
    daily.set(day, (daily.get(day) ?? 0) + count);
  }

  const now = Date.now();
  const totalLast24h = hourly
    .filter(({ hour }) => now - Date.parse(`${hour}:00:00Z`) < 24 * 60 * 60 * 1000)
    .reduce((sum, { count }) => sum + count, 0);
  const totalLast7d = hourly
    .filter(({ hour }) => now - Date.parse(`${hour}:00:00Z`) < 7 * 24 * 60 * 60 * 1000)
    .reduce((sum, { count }) => sum + count, 0);

  return {
    hourly,
    daily: Array.from(daily.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => (a.day < b.day ? 1 : -1)),
    totalLast24h,
    totalLast7d,
  };
}
