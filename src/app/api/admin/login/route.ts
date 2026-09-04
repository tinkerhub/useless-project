import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminSessionValue,
  checkAdminPassword,
  clearLoginAttempts,
  isLoginRateLimited,
  registerFailedLogin,
} from "@/lib/admin-auth";
import { clientIp } from "@/lib/rate-limit";
import { isRequestTooLarge } from "@/lib/request-guards";

// A real payload here is just a password string, well under this.
const MAX_BODY_BYTES = 1024;

export async function POST(request: Request) {
  if (isRequestTooLarge(request, MAX_BODY_BYTES)) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

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
