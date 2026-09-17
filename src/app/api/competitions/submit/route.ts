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
    // An empty allow-list means any host is fine (e.g. a journal page can live on GitHub Pages,
    // Vercel, Netlify, or a custom domain) - just require a well-formed http(s) URL.
    if (allowedHosts.length === 0) return true;
    const host = url.hostname.replace(/^www\./, "");
    // Exact match for fixed hosts (instagram.com), or a subdomain match for hosts that vary per
    // submitter (e.g. github.io - each entry lives at a different <username>.github.io).
    return allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
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

  const { slug, name, campus, link, notes, teamName, projectName } = body as Record<string, unknown>;

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
  if (competition.extraFields?.teamName && teamName !== undefined && (typeof teamName !== "string" || teamName.length > 100)) {
    return NextResponse.json({ error: "Team name is too long." }, { status: 400 });
  }
  if (competition.extraFields?.projectName && (typeof projectName !== "string" || projectName.trim().length < 2 || projectName.trim().length > 150)) {
    return NextResponse.json({ error: "Enter the project name." }, { status: 400 });
  }

  try {
    await createSubmission(competition.airtableTableId, {
      Name: name.trim(),
      Campus: campus,
      "Submission Link": link,
      ...(notes ? { Notes: notes } : {}),
      ...(competition.extraFields?.teamName && typeof teamName === "string" && teamName.trim() ? { "Team Name": teamName.trim() } : {}),
      ...(competition.extraFields?.projectName ? { "Project Name": (projectName as string).trim() } : {}),
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
