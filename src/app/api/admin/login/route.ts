import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminSessionValue, checkAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = (body as Record<string, unknown> | null)?.password;

  if (typeof password !== "string") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let ok: boolean;
  try {
    ok = checkAdminPassword(password);
  } catch {
    return NextResponse.json({ error: "Admin login isn't configured." }, { status: 500 });
  }

  if (!ok) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminSessionValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
