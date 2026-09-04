import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createSubmission, submissionsTag } from "@/lib/airtable";
import { CAMPUSES, getCompetition } from "@/lib/competitions";
import { isRequestTooLarge } from "@/lib/request-guards";

// A real payload here (a name, campus, link, and short notes) runs well under 1KB.
const MAX_BODY_BYTES = 4 * 1024;

function isValidSubmissionLink(link: string, allowedHosts: string[]) {
  try {
    const url = new URL(link);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.replace(/^www\./, "");
    return allowedHosts.includes(host);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (isRequestTooLarge(request, MAX_BODY_BYTES)) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { slug, name, campus, link, notes } = body as Record<string, unknown>;

  const competition = typeof slug === "string" ? getCompetition(slug) : undefined;
  if (!competition || competition.autoJudged || !competition.airtableTableId || !competition.linkHosts || !competition.linkLabel) {
    return NextResponse.json({ error: "Unknown competition." }, { status: 400 });
  }

  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }
  if (typeof campus !== "string" || !CAMPUSES.includes(campus as (typeof CAMPUSES)[number])) {
    return NextResponse.json({ error: "Select your campus." }, { status: 400 });
  }
  if (typeof link !== "string" || !isValidSubmissionLink(link, competition.linkHosts)) {
    return NextResponse.json({ error: `Enter a valid ${competition.linkLabel}.` }, { status: 400 });
  }
  if (notes !== undefined && (typeof notes !== "string" || notes.length > 500)) {
    return NextResponse.json({ error: "Notes are too long." }, { status: 400 });
  }

  try {
    await createSubmission(competition.airtableTableId, {
      Name: name.trim(),
      Campus: campus,
      "Submission Link": link,
      ...(notes ? { Notes: notes } : {}),
    });
  } catch (error) {
    console.error("Competition submission failed:", error);
    return NextResponse.json({ error: "Couldn't save your submission. Try again in a bit." }, { status: 502 });
  }

  // Invalidate the cached read for this competition's table so /submissions shows the new entry
  // right away, instead of waiting for the fallback revalidate window.
  revalidateTag(submissionsTag(competition.airtableTableId), { expire: 0 });

  return NextResponse.json({ ok: true });
}
