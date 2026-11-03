import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getPeopleReport } from "@/lib/people-stats";

// Backs the "people page" card in the admin panel - see people-stats.ts for what is counted.
export async function GET() {
  const jar = await cookies();
  if (!isValidAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const report = await getPeopleReport();
  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}
