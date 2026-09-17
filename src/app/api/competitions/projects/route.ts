import { NextResponse } from "next/server";
import { listProjects } from "@/lib/metabase";

// Backs the project search/pick step on a project-submission competition's page - the picker
// component runs in the browser, so it can't call listProjects() (and its METABASE_API_KEY)
// directly. Only the handful of fields the picker actually needs are sent down, not the full
// project record (description, cover image, etc.).
export async function GET() {
  const projects = await listProjects();
  return NextResponse.json(
    projects.map((project) => ({
      id: project.id,
      name: project.name,
      teamName: project.teamName,
      campus: project.venueName ?? project.campusName,
      link: project.projectUrl ?? project.sourceCodeUrl,
    }))
  );
}
