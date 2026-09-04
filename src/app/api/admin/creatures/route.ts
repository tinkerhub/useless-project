import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { listAllCreaturesForAdmin } from "@/lib/creatures";

export async function GET() {
  const jar = await cookies();
  if (!isValidAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const creatures = await listAllCreaturesForAdmin();
  return NextResponse.json({ creatures: [...creatures].reverse() });
}
