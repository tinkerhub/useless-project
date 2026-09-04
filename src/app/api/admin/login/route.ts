import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminSessionValue,
  checkAdminPassword,
  clearLoginAttempts,
  isLoginRateLimited,
  registerFailedLogin,
} from "@/lib/admin-auth";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (isLoginRateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

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
    registerFailedLogin(ip);
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  clearLoginAttempts(ip);
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
