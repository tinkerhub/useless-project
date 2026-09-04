// A per-key sliding-window-ish counter kept in the function instance's own memory - there's no
// datastore wired up for this, so a cold start or a request landing on a different warm instance
// resets a key's count. That's an accepted gap for a small site, not a substitute for a real
// store-backed limiter; it still stops a script from hammering an endpoint from one IP in a loop.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// Returns true if `key` has hit `limit` uses within `windowMs`, and bumps its count either way -
// callers check this before doing the expensive/sensitive work, so a request that's over the
// limit still counts against the next window instead of getting a free retry.
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
