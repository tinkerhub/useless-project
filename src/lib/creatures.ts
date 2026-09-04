// Only ever imported from Route Handlers and Server Components - Netlify Blobs needs the
// runtime context Netlify injects into functions (or that `netlify dev` proxies in locally), so
// this never runs against a plain `next dev` server.
import { getStore } from "@netlify/blobs";
import hiddenNamesConfig from "./hidden-creature-names.json";

const STORE_NAME = "creatures";
const KEY = "all";
const SETTINGS_KEY = "settings";
const MAX_CREATURES = 300;

type Settings = {
  // Flipped from /admin to stop new creatures without touching the gallery itself.
  submissionsClosed: boolean;
};

export const GRID_SIZE = 16;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;

export type Creature = {
  id: string;
  name: string;
  pixels: (string | null)[];
  createdAt: string;
  // An anonymous per-browser id (see pixel-editor.tsx), used only to enforce the per-visitor
  // creature cap in the submit route - never returned by /api/creatures/list.
  deviceId: string;
};

// What the gallery and its client components actually work with - never carries deviceId across
// the wire to other visitors' browsers, since it doesn't need it and it's not for them anyway.
export type PublicCreature = Omit<Creature, "deviceId">;

function tryStore() {
  try {
    return getStore(STORE_NAME);
  } catch {
    return null;
  }
}

// Names to hide from the gallery without deleting the underlying creature - lets us keep
// drawings people can't easily re-submit without wiping data. Two match modes, since a plain
// substring check is too broad for short/common strings: "contains" hides a name that has the
// pattern anywhere in it (e.g. a slur buried in a longer name), while "exact" only hides a name
// that, after trimming and lowercasing, matches the pattern exactly - so listing a short pattern
// like "pp" there doesn't also hide "apple", "happy", "puppy", and every other word that happens
// to contain those two letters.
const hiddenNames = hiddenNamesConfig as { contains?: string[]; exact?: string[] };
const containsPatterns = (hiddenNames.contains ?? []).map((n) => n.toLowerCase());
const exactPatterns = new Set((hiddenNames.exact ?? []).map((n) => n.toLowerCase()));

function isHidden(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return exactPatterns.has(lower) || containsPatterns.some((pattern) => lower.includes(pattern));
}

// Raw read, with nothing hidden - the only version safe to build a write-back list from (see
// addCreature) or to check the per-device cap against, since a hidden creature still counts.
async function readAllCreatures(): Promise<Creature[]> {
  const store = tryStore();
  if (!store) return [];
  try {
    const data = await store.get(KEY, { type: "json" });
    return Array.isArray(data) ? (data as Creature[]) : [];
  } catch {
    return [];
  }
}

// Used by the gallery. Fails soft (empty array) rather than throwing, so a plain `next dev`
// session or a misconfigured deploy shows an empty gallery instead of a broken page.
export async function listCreatures(): Promise<Creature[]> {
  const creatures = await readAllCreatures();
  return creatures.filter((c) => !isHidden(c.name));
}

// All creatures live in one JSON blob rather than one-blob-per-creature: the gallery always
// wants the full set, and listing the store would mean one extra round trip per creature just to
// read it back. The tradeoff is a last-write-wins race if two people submit at the same instant -
// acceptable for a for-fun gallery, not worth conditional writes here.
export async function addCreature(name: string, pixels: (string | null)[], deviceId: string): Promise<Creature> {
  const creature: Creature = {
    id: crypto.randomUUID(),
    name,
    pixels,
    createdAt: new Date().toISOString(),
    deviceId,
  };

  const store = getStore(STORE_NAME);
  const existing = await readAllCreatures();
  const next = [...existing, creature].slice(-MAX_CREATURES);
  await store.setJSON(KEY, next);
  return creature;
}

// Raw count, ignoring the hidden-name filter, so hiding a creature from the gallery doesn't let
// its device submit past the cap again.
export async function countCreaturesForDevice(deviceId: string): Promise<number> {
  const all = await readAllCreatures();
  return all.filter((c) => c.deviceId === deviceId).length;
}
