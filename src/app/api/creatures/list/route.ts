import { NextResponse } from "next/server";
import { listCreatures } from "@/lib/creatures";

// Backs the gallery's periodic poll (see live-creatures.tsx) - kept separate from the page's own
// server-side fetch so a poll only ever costs a cheap JSON read, not a full page re-render.
export async function GET() {
  const creatures = await listCreatures();
  return NextResponse.json({ creatures });
}
