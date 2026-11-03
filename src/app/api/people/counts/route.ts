import { NextResponse } from "next/server";
import { getPeopleReport } from "@/lib/people-stats";

// The public totals shown on the people page (games played, photos taken). Counting means listing
// every event blob, so the answer is shared from the CDN for a minute rather than worked out for
// every visitor; the page bumps its own number straight away when you play, so it never looks stuck.
export async function GET() {
  const { totals } = await getPeopleReport();
  return NextResponse.json(
    { totals },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
