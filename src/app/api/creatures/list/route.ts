import { NextResponse } from "next/server";
import { getGalleryBigMessage, listCreatures, type PublicCreature } from "@/lib/creatures";
import { recordHit } from "@/lib/hits";

// Backs the gallery's periodic poll (see live-creatures.tsx) - kept separate from the page's own
// server-side fetch so a poll only ever costs a cheap JSON read, not a full page re-render. The
// announcement banner rides along on this same poll (see getGalleryBigMessage) rather than its
// own endpoint - it's cheap, and it means posting or clearing one from /admin reaches whoever's
// looking at the gallery within one poll interval, the same as a new creature does.
export async function GET() {
  // Rides along on this same invocation rather than its own endpoint - see hits.ts for why this
  // is deliberately the only place hit-counting happens.
  const [creatures, message] = await Promise.all([listCreatures(), getGalleryBigMessage(), recordHit()]);
  // deviceId is only for enforcing the per-visitor cap in the submit route - no reason to hand
  // every visitor's anonymous id to every other visitor's browser.
  const visible: PublicCreature[] = creatures.map(({ id, name, pixels, createdAt }) => ({ id, name, pixels, createdAt }));
  return NextResponse.json(
    { creatures: visible, message },
    // The client poll itself passes `cache: "no-store"` (it always wants a fresh check), but that
    // only governs the requesting browser's own cache - it doesn't stop Netlify's CDN from
    // sharing one cached response across the many different visitors polling this same endpoint
    // within the same few seconds. A public max-age lets it do that instead of invoking this
    // function (and re-reading the blob store) for every single poll from every single open tab -
    // this was 3s/15s back when the client polled every 4s; now that the poll itself is 45s
    // (see live-creatures.tsx), a window that short barely overlaps two polls. Widened to match,
    // so most polls across all open tabs get served straight from the edge cache.
    { headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=45" } }
  );
}
