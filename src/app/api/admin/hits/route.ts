import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getHitReport } from "@/lib/hits";

// Backs the "traffic" card in the admin panel - see hits.ts for what's actually being counted
// (and what isn't: this is origin invocations of the gallery poll, not a per-visitor count).
export async function GET() {
  const jar = await cookies();
  if (!isValidAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const report = await getHitReport();
  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}
