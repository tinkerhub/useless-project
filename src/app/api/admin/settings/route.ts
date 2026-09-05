import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import {
  areCreatureSubmissionsClosed,
  getGalleryBigMessage,
  setCreatureSubmissionsClosed,
  setGalleryBigMessage,
} from "@/lib/creatures";

export async function GET() {
  const jar = await cookies();
  if (!isValidAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [closed, bigMessage] = await Promise.all([areCreatureSubmissionsClosed(), getGalleryBigMessage()]);
  return NextResponse.json({ closed, bigMessage });
}

// Each field is independently optional in the request body - the admin panel's two controls
// (the submissions toggle and the big-message editor) each save on their own action, so a single
// request only ever carries the one field it's actually changing, not the other's current value.
export async function POST(request: Request) {
  const jar = await cookies();
  if (!isValidAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || (!("closed" in body) && !("bigMessage" in body))) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if ("closed" in body && typeof body.closed !== "boolean") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if ("bigMessage" in body && body.bigMessage !== null && typeof body.bigMessage !== "string") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    if ("closed" in body) await setCreatureSubmissionsClosed(body.closed as boolean);
    if ("bigMessage" in body) await setGalleryBigMessage(body.bigMessage as string | null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Updating a creature setting failed:", error);
    return NextResponse.json({ error: "Couldn't reach storage." }, { status: 502 });
  }
}
