import { NextResponse } from "next/server";
import { listCreatures, type PublicCreature } from "@/lib/creatures";

// Backs the gallery's periodic poll (see live-creatures.tsx) - kept separate from the page's own
// server-side fetch so a poll only ever costs a cheap JSON read, not a full page re-render.
export async function GET() {
  const creatures = await listCreatures();
  // deviceId is only for enforcing the per-visitor cap in the submit route - no reason to hand
  // every visitor's anonymous id to every other visitor's browser.
  const visible: PublicCreature[] = creatures.map(({ id, name, pixels, createdAt }) => ({ id, name, pixels, createdAt }));
  return NextResponse.json({ creatures: visible });
}
