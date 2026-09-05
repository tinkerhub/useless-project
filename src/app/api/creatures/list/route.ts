import { NextResponse } from "next/server";
import { getGalleryBigMessage, listCreatures, type PublicCreature } from "@/lib/creatures";

// Backs the gallery's periodic poll (see live-creatures.tsx) - kept separate from the page's own
// server-side fetch so a poll only ever costs a cheap JSON read, not a full page re-render. The
// announcement banner rides along on this same poll (see getGalleryBigMessage) rather than its
// own endpoint - it's cheap, and it means posting or clearing one from /admin reaches whoever's
// looking at the gallery within one poll interval, the same as a new creature does.
export async function GET() {
  const [creatures, message] = await Promise.all([listCreatures(), getGalleryBigMessage()]);
  // deviceId is only for enforcing the per-visitor cap in the submit route - no reason to hand
  // every visitor's anonymous id to every other visitor's browser.
  const visible: PublicCreature[] = creatures.map(({ id, name, pixels, createdAt }) => ({ id, name, pixels, createdAt }));
  return NextResponse.json(
    { creatures: visible, message },
    // The client poll itself passes `cache: "no-store"` (it always wants a fresh check), but that
    // only governs the requesting browser's own cache - it doesn't stop Netlify's CDN from
    // sharing one cached response across the many different visitors polling this same endpoint
    // within the same few seconds. A short public max-age lets it do that instead of re-reading
    // the blob store for every single poll from every single open tab.
    { headers: { "Cache-Control": "public, max-age=3, stale-while-revalidate=15" } }
  );
}
