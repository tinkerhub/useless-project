// The things counted on the people page (see people-stats.ts). Kept apart from the blob code so the
// page and the admin panel can use the list without pulling the blob client into the browser.
// "game-player" and "photo-taker" go out once per browser, so they count people rather than times.
export const PEOPLE_EVENTS = [
  "visit",
  "game-player",
  "game-played",
  "game-won",
  "game-lost",
  "photo-taker",
  "photo-taken",
  "photo-saved",
] as const;
export type PeopleEvent = (typeof PEOPLE_EVENTS)[number];

export function isPeopleEvent(value: unknown): value is PeopleEvent {
  return typeof value === "string" && (PEOPLE_EVENTS as readonly string[]).includes(value);
}

export type PeopleReport = {
  totals: Record<PeopleEvent, number>;
  // Newest day first: "2026-11-03" -> count per event.
  daily: { day: string; counts: Record<PeopleEvent, number> }[];
};
