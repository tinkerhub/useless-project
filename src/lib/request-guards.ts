// A cheap early rejection for an oversized request body, checked before the route ever calls
// request.json() - a legitimate payload for any of these routes is a few hundred bytes at most,
// so there's no reason to let a much larger one get fully parsed and validated first.
//
// This only catches a body whose Content-Length header is honest. A client that lies about (or
// omits) that header can still make the runtime buffer a large body before our code runs at all -
// closing that gap needs a platform-level request-size limit, not application code. This is a
// low-cost first line of defense, not the whole fix.
export function isRequestTooLarge(request: Request, maxBytes: number): boolean {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return false;
  const bytes = Number(contentLength);
  return Number.isFinite(bytes) && bytes > maxBytes;
}
