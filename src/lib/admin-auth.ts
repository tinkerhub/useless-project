// Only ever imported from Route Handlers and Server Components - reads ADMIN_PASSWORD, which
// must not reach the browser bundle.
import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "admin_session";

function adminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  return password;
}

// Stateless session token: an HMAC of a fixed label keyed by the admin password, rather than a
// random token in a session store - there's nowhere to persist one across serverless invocations
// here. Anyone who knows ADMIN_PASSWORD can derive it, which is fine since the password is the
// actual secret; this only saves it from sitting in a plaintext cookie.
function sessionToken(): string {
  return createHmac("sha256", adminPassword()).update("admin-session").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkAdminPassword(password: string): boolean {
  return safeEqual(password, adminPassword());
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

// In-memory per-IP throttle against password guessing - the only thing standing between the
// login form and someone scripting a wordlist against it. Lives in the function instance's
// memory rather than a database, so a cold start or a request landing on a different warm
// instance resets it; that's an accepted gap given there's no datastore wired up for this, not a
// substitute for a strong password.
const attemptsByIp = new Map<string, { count: number; resetAt: number }>();

export function isLoginRateLimited(ip: string): boolean {
  const entry = attemptsByIp.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    attemptsByIp.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function registerFailedLogin(ip: string): void {
  const entry = attemptsByIp.get(ip);
  if (!entry || Date.now() > entry.resetAt) {
    attemptsByIp.set(ip, { count: 1, resetAt: Date.now() + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearLoginAttempts(ip: string): void {
  attemptsByIp.delete(ip);
}

export function isValidAdminSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  try {
    return safeEqual(cookieValue, sessionToken());
  } catch {
    return false;
  }
}

export function adminSessionValue(): string {
  return sessionToken();
}
