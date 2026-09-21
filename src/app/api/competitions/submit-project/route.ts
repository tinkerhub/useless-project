import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createSubmission, submissionsTag } from "@/lib/airtable";
import { getCompetition, isSubmissionClosed } from "@/lib/competitions";
import { isRequestTooLarge } from "@/lib/request-guards";

// A real payload here (a project id/name/team/campus and an optional link) runs well under 1KB.
const MAX_BODY_BYTES = 4 * 1024;

export async function POST(request: Request) {
  if (isRequestTooLarge(request, MAX_BODY_BYTES)) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { slug, projectId, projectName, teamName, campus, projectLink } = body as Record<string, unknown>;

  const competition = typeof slug === "string" ? getCompetition(slug) : undefined;
  if (!competition || competition.submitVia !== "project" || !competition.airtableTableId) {
    return NextResponse.json({ error: "Unknown competition." }, { status: 400 });
  }

  if (isSubmissionClosed(competition)) {
    return NextResponse.json({ error: "Submissions for this competition are closed." }, { status: 403 });
  }

  // The picker only ever offers projects Metabase already returned, so these come from that data
  // rather than free text - still validated as a defense against a hand-crafted request.
  if (typeof projectId !== "number" || !Number.isFinite(projectId)) {
    return NextResponse.json({ error: "Select a project." }, { status: 400 });
  }
  if (typeof projectName !== "string" || projectName.trim().length < 1 || projectName.trim().length > 200) {
    return NextResponse.json({ error: "Select a project." }, { status: 400 });
  }
  if (typeof campus !== "string" || campus.trim().length < 1 || campus.trim().length > 200) {
    return NextResponse.json({ error: "That project has no campus on record." }, { status: 400 });
  }
  if (teamName !== undefined && teamName !== null && (typeof teamName !== "string" || teamName.length > 150)) {
    return NextResponse.json({ error: "Invalid team name." }, { status: 400 });
  }
  if (projectLink !== undefined && projectLink !== null && typeof projectLink !== "string") {
    return NextResponse.json({ error: "Invalid project link." }, { status: 400 });
  }

  try {
    await createSubmission(competition.airtableTableId, {
      Campus: campus.trim(),
      "Project Name": projectName.trim(),
      Competition: competition.prizeLabel,
      "Project ID": projectId,
      ...(typeof teamName === "string" && teamName.trim() ? { "Team Name": teamName.trim() } : {}),
      ...(typeof projectLink === "string" && projectLink.trim() ? { "Project Link": projectLink.trim() } : {}),
    });
  } catch (error) {
    console.error("Competition entry failed:", error);
    return NextResponse.json({ error: "Couldn't save your entry. Try again in a bit." }, { status: 502 });
  }

  revalidateTag(submissionsTag(competition.airtableTableId), { expire: 0 });

  return NextResponse.json({ ok: true });
}
