// What people do on the people page: how many opened it, played find-the-brick (and won or lost),
// took the group photo and saved it. Each event is its own tiny blob, keyed by event name and time,
// so two visitors at the same moment never overwrite each other's count (unlike a read-add-write
// counter, see hits.ts) - the totals are just how many keys each event has.
import { getStore } from "@netlify/blobs";
import { PEOPLE_EVENTS, type PeopleEvent, type PeopleReport } from "./people-events";

const STORE_NAME = "people-stats";

function tryStore() {
  try {
    // Strong consistency: a listing includes events written a moment ago (the default can lag by
    // up to a minute, which made the totals look stuck).
    return getStore({ name: STORE_NAME, consistency: "strong" });
  } catch {
    return null;
  }
}

export async function recordPeopleEvent(event: PeopleEvent): Promise<void> {
  const store = tryStore();
  if (!store) return;
  const at = new Date().toISOString();
  await store.set(`${event}/${at}-${Math.random().toString(36).slice(2, 8)}`, "");
}

const zero = () => Object.fromEntries(PEOPLE_EVENTS.map((e) => [e, 0])) as Record<PeopleEvent, number>;

export async function getPeopleReport(): Promise<PeopleReport> {
  const store = tryStore();
  const totals = zero();
  const days = new Map<string, Record<PeopleEvent, number>>();
  if (store) {
    await Promise.all(
      PEOPLE_EVENTS.map(async (event) => {
        const { blobs } = await store.list({ prefix: `${event}/` });
        totals[event] = blobs.length;
        for (const { key } of blobs) {
          const day = key.slice(event.length + 1, event.length + 11);
          const counts = days.get(day) ?? zero();
          counts[event] += 1;
          days.set(day, counts);
        }
      }),
    );
  }
  return {
    totals,
    daily: Array.from(days.entries())
      .map(([day, counts]) => ({ day, counts }))
      .sort((a, b) => (a.day < b.day ? 1 : -1)),
  };
}
