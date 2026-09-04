import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { areCreatureSubmissionsClosed, setCreatureSubmissionsClosed } from "@/lib/creatures";

export async function GET() {
  const jar = await cookies();
  if (!isValidAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({ closed: await areCreatureSubmissionsClosed() });
}

export async function POST(request: Request) {
  const jar = await cookies();
  if (!isValidAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const closed = (body as Record<string, unknown> | null)?.closed;
  if (typeof closed !== "boolean") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    await setCreatureSubmissionsClosed(closed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Updating submissions-closed setting failed:", error);
    return NextResponse.json({ error: "Couldn't reach storage." }, { status: 502 });
  }
}
