import type { Metadata } from "next";
import { listProjects } from "@/lib/metabase";
import { TOP_PROJECT_IDS } from "@/lib/top-projects";
import ProjectsGrid from "./projects-grid";

export const metadata: Metadata = {
  title: "Projects · Useless Projects",
  description: "Every project submitted for Useless Projects 3.0.",
};

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const projects = await listProjects();
  // /projects?filter=top (the results page's "view top projects" button) opens with only the top
  // projects showing; the toggle on the page still turns it off.
  const topOnly = (await searchParams).filter === "top";
  // Only the ids that are actually in this list - the set itself never ships to the browser.
  const topProjectIds = projects.filter((p) => TOP_PROJECT_IDS.has(p.id)).map((p) => p.id);
  const venueCount = new Set(projects.map((p) => p.venueName ?? p.campusName).filter(Boolean)).size;

  return (
    <main data-page="handbook" className="w-full overflow-x-hidden bg-white text-[#0e0e0d]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-5 py-14 sm:px-8 sm:py-20">
        <header className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="font-drowner leading-[0.95] text-[#0e0e0d]" style={{ fontSize: "clamp(36px, 6vw, 56px)" }}>
              projects
            </h1>
            <p className="font-nanum-pen max-w-[52ch] text-[21px] leading-[1.4] text-[#244638] sm:text-[23px]">
              Every project submitted for Useless Projects 3.0.
            </p>
          </div>

          <div className="flex gap-8 sm:gap-10">
            <div className="flex flex-col">
              <span className="font-drowner leading-none text-[#0e0e0d]" style={{ fontSize: "clamp(40px, 10vw, 64px)" }}>
                {projects.length}
              </span>
              <span className="font-helvetica text-[12px] tracking-[0.06em] text-[#33322f]/60 uppercase">
                project{projects.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-drowner leading-none text-[#0e0e0d]" style={{ fontSize: "clamp(40px, 10vw, 64px)" }}>
                {venueCount}
              </span>
              <span className="font-helvetica text-[12px] tracking-[0.06em] text-[#33322f]/60 uppercase">
                venue{venueCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </header>

        {projects.length === 0 ? (
          <p className="font-helvetica max-w-[60ch] text-[16px] leading-[1.7] text-[#33322f]">
            Nothing here yet - check back once teams start submitting.
          </p>
        ) : (
          <ProjectsGrid projects={projects} topProjectIds={topProjectIds} initialTopOnly={topOnly} />
        )}
      </div>
    </main>
  );
}
