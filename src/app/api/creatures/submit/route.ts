import { NextResponse } from "next/server";
import { addCreature, CELL_COUNT } from "@/lib/creatures";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, pixels } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 40) {
    return NextResponse.json({ error: "Give your creature a name." }, { status: 400 });
  }
  if (
    !Array.isArray(pixels) ||
    pixels.length !== CELL_COUNT ||
    !pixels.every((p) => p === null || (typeof p === "string" && HEX_COLOR.test(p)))
  ) {
    return NextResponse.json({ error: "Invalid pixel data." }, { status: 400 });
  }
  if (pixels.every((p) => p === null)) {
    return NextResponse.json({ error: "Draw something first." }, { status: 400 });
  }

  try {
    const creature = await addCreature(name.trim(), pixels as (string | null)[]);
    return NextResponse.json({ ok: true, id: creature.id });
  } catch (error) {
    console.error("Creature submission failed:", error);
    return NextResponse.json({ error: "Couldn't save your creature. Try again in a bit." }, { status: 502 });
  }
}
