import { NextResponse } from "next/server";
import { isPeopleEvent } from "@/lib/people-events";
import { recordPeopleEvent } from "@/lib/people-stats";

// Takes one event from the people page (sent with navigator.sendBeacon, so the body arrives as
// plain text). Anything that is not one of the known events is ignored.
export async function POST(request: Request) {
  try {
    const { event } = JSON.parse(await request.text()) as { event?: unknown };
    if (!isPeopleEvent(event)) return NextResponse.json({ error: "Unknown event." }, { status: 400 });
    await recordPeopleEvent(event);
  } catch {
    // A missed count is not worth an error the visitor would never see anyway.
  }
  return new NextResponse(null, { status: 204 });
}
