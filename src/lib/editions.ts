// One entry per year of Useless Projects. Anything year-specific (dates, which pages a year has,
// where its links point) is read from here, so program-level parts of the site never hardcode
// "3.0".
//
// The current edition has no front door of its own: "/" is its home, and /<slug> redirects there.
//
// Starting a new year: add an entry, set `live: true` once its pages exist, and point
// CURRENT_EDITION at it. The menu, the old-link redirects (next.config.ts) and the sitemap follow.

export type EditionSlug = "1.0" | "2.0" | "3.0";
export type EditionPage = "handbook" | "competitions" | "submissions" | "results";

export type Edition = {
  slug: EditionSlug;
  year: number;
  title: string;
  // false = listed on /editions as "coming back soon", but no /<slug> pages are built yet.
  live: boolean;
  // Which year-specific pages this edition has. Missing pages 404 and are left out of the menu.
  pages: Record<EditionPage, boolean>;
  // IST with explicit offsets so it's correct in any visitor's timezone.
  eventStart?: string;
  eventEnd?: string;
};

export const EDITIONS: Record<EditionSlug, Edition> = {
  "1.0": {
    slug: "1.0", year: 2024, title: "Useless Projects 1.0", live: false,
    pages: { handbook: false, competitions: false, submissions: false, results: false },
  },
  "2.0": {
    slug: "2.0", year: 2025, title: "Useless Projects 2.0", live: false,
    pages: { handbook: false, competitions: false, submissions: false, results: false },
  },
  "3.0": {
    slug: "3.0", year: 2026, title: "Useless Projects 3.0", live: true,
    pages: { handbook: true, competitions: true, submissions: true, results: true },
    eventStart: "2026-09-03T17:00:00+05:30",
    eventEnd: "2026-09-14T23:59:59+05:30", // end of day Sep 14: last venue slot closes that afternoon
  },
};

// The one line to change each year.
export const CURRENT_EDITION: EditionSlug = "3.0";

export const EDITION_PAGES: EditionPage[] = ["results", "handbook", "competitions", "submissions"];

export const currentEdition = () => EDITIONS[CURRENT_EDITION];
export const allEditions = () => Object.values(EDITIONS).sort((a, b) => b.year - a.year);
export const liveEditions = () => allEditions().filter((e) => e.live);

export function isEditionSlug(value: string): value is EditionSlug {
  return Object.prototype.hasOwnProperty.call(EDITIONS, value);
}

// "/3.0", "/3.0/handbook", "/3.0/competitions/venue-aftermovie"
export function editionPath(slug: EditionSlug, ...rest: string[]) {
  return ["", slug, ...rest].join("/");
}

// Where an edition's home is: "/" for the current one, /<slug> for past ones.
export function editionHome(slug: EditionSlug) {
  return slug === CURRENT_EDITION ? "/" : editionPath(slug);
}

// For pages under app/[edition]: the edition from the URL if it exists, is live, and has this
// page. Returns null otherwise so the page can call notFound().
export function resolveEdition(value: string, page?: EditionPage): Edition | null {
  if (!isEditionSlug(value)) return null;
  const edition = EDITIONS[value];
  if (!edition.live) return null;
  if (page && !edition.pages[page]) return null;
  return edition;
}
