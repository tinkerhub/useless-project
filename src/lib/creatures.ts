// Only ever imported from Route Handlers and Server Components - Netlify Blobs needs the
// runtime context Netlify injects into functions (or that `netlify dev` proxies in locally), so
// this never runs against a plain `next dev` server.
import { getStore } from "@netlify/blobs";

const STORE_NAME = "creatures";
const KEY = "all";
const MAX_CREATURES = 300;

export const GRID_SIZE = 16;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;

export type Creature = {
  id: string;
  name: string;
  pixels: (string | null)[];
  createdAt: string;
};

function tryStore() {
  try {
    return getStore(STORE_NAME);
  } catch {
    return null;
  }
}

// Used by the gallery. Fails soft (empty array) rather than throwing, so a plain `next dev`
// session or a misconfigured deploy shows an empty gallery instead of a broken page.
export async function listCreatures(): Promise<Creature[]> {
  const store = tryStore();
  if (!store) return [];
  try {
    const data = await store.get(KEY, { type: "json" });
    return Array.isArray(data) ? (data as Creature[]) : [];
  } catch {
    return [];
  }
}

// All creatures live in one JSON blob rather than one-blob-per-creature: the gallery always
// wants the full set, and listing the store would mean one extra round trip per creature just to
// read it back. The tradeoff is a last-write-wins race if two people submit at the same instant -
// acceptable for a for-fun gallery, not worth conditional writes here.
export async function addCreature(name: string, pixels: (string | null)[]): Promise<Creature> {
  const creature: Creature = {
    id: crypto.randomUUID(),
    name,
    pixels,
    createdAt: new Date().toISOString(),
  };

  const store = getStore(STORE_NAME);
  const existing = await listCreatures();
  const next = [...existing, creature].slice(-MAX_CREATURES);
  await store.setJSON(KEY, next);
  return creature;
}
