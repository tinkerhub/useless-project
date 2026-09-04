import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { deleteCreature } from "@/lib/creatures";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  if (!isValidAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const deleted = await deleteCreature(id);
    if (!deleted) {
      return NextResponse.json({ error: "Creature not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Creature delete failed:", error);
    return NextResponse.json({ error: "Couldn't reach storage." }, { status: 502 });
  }
}
