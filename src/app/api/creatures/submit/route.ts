import { NextResponse } from "next/server";
import { addCreature, areCreatureSubmissionsClosed, countCreaturesForDevice, CELL_COUNT } from "@/lib/creatures";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

// Keeps the gallery from filling up with plain solid-color rectangles (the path of least
// resistance if there's no floor at all) - a real creature takes a few more pixels and more than
// one color to make. Checked server-side since the editor's own version of this is just UX; a
// direct API call could otherwise skip it entirely.
const MIN_FILLED_PIXELS = 10;
const MIN_COLORS = 2;

// One browser gets 2 creatures. There's no login here, so "one browser" is a per-visitor id the
// editor generates and keeps in localStorage (see pixel-editor.tsx) - easy enough to dodge by
// clearing storage or using another device, but this is a soft cap against one enthusiastic
// visitor filling the gallery, not a security boundary.
const MAX_PER_DEVICE = 2;
const DEVICE_ID_PATTERN = /^[a-zA-Z0-9-]{1,100}$/;

export async function POST(request: Request) {
  if (await areCreatureSubmissionsClosed()) {
    return NextResponse.json({ error: "Submissions are closed right now." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, pixels, deviceId } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 40) {
    return NextResponse.json({ error: "Give your creature a name." }, { status: 400 });
  }
  if (typeof deviceId !== "string" || !DEVICE_ID_PATTERN.test(deviceId)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (
    !Array.isArray(pixels) ||
    pixels.length !== CELL_COUNT ||
    !pixels.every((p) => p === null || (typeof p === "string" && HEX_COLOR.test(p)))
  ) {
    return NextResponse.json({ error: "Invalid pixel data." }, { status: 400 });
  }
  const filled = (pixels as (string | null)[]).filter((p): p is string => p !== null);
  if (filled.length === 0) {
    return NextResponse.json({ error: "Draw something first." }, { status: 400 });
  }
  if (filled.length < MIN_FILLED_PIXELS) {
    return NextResponse.json({ error: "Draw a bit more before releasing it." }, { status: 400 });
  }
  if (new Set(filled).size < MIN_COLORS) {
    return NextResponse.json({ error: "Use at least two colors - no solid-color blocks." }, { status: 400 });
  }

  if ((await countCreaturesForDevice(deviceId)) >= MAX_PER_DEVICE) {
    return NextResponse.json({ error: "You've already released 2 creatures - that's the limit for now." }, { status: 400 });
  }

  try {
    const creature = await addCreature(name.trim(), pixels as (string | null)[], deviceId);
    return NextResponse.json({ ok: true, id: creature.id });
  } catch (error) {
    console.error("Creature submission failed:", error);
    return NextResponse.json({ error: "Couldn't save your creature. Try again in a bit." }, { status: 502 });
  }
}
