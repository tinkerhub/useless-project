"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/metabase";
import Dropdown from "./dropdown";

const STATUS_STYLE: Record<string, string> = {
  Valid: "bg-[#244638]/10 text-[#244638]",
  "Send for Voting": "bg-[#ea34df]/10 text-[#ea34df]",
  "Review Pending": "bg-black/5 text-[#33322f]/70",
};

type Sort = "latest" | "oldest" | "name";

function IconFilter(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 5h16M7 12h10M10.5 19h3" />
    </svg>
  );
}

export default function ProjectsGrid({ projects }: { projects: Project[] }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<Sort>("latest");
  const [venue, setVenue] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const venues = useMemo(
    () =>
      Array.from(new Set(projects.map((p) => p.venueName ?? p.campusName).filter((v): v is string => Boolean(v)))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [projects]
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          projects.flatMap((p) => (p.categories ? p.categories.split(",").map((c) => c.trim()) : [])).filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [projects]
  );

  const statuses = useMemo(
    () => Array.from(new Set(projects.map((p) => p.status).filter((s): s is string => Boolean(s)))).sort((a, b) => a.localeCompare(b)),
    [projects]
  );

  const types = useMemo(
    () => Array.from(new Set(projects.map((p) => p.type).filter((t): t is string => Boolean(t)))).sort((a, b) => a.localeCompare(b)),
    [projects]
  );

  const visible = useMemo(() => {
    let list = projects.filter((p) => {
      if (venue !== "all" && (p.venueName ?? p.campusName) !== venue) return false;
      if (status !== "all" && p.status !== status) return false;
      if (type !== "all" && p.type !== type) return false;
      if (category !== "all") {
        const cats = p.categories ? p.categories.split(",").map((c) => c.trim()) : [];
        if (!cats.includes(category)) return false;
      }
      return true;
    });

    // The list already arrives newest-first from the query, so "latest" needs no work here.
    if (sort === "oldest") list = [...list].reverse();
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [projects, sort, venue, category, status, type]);

  const activeFilterCount = [venue, category, status, type].filter((v) => v !== "all").length;

  return (
    <>
      {/* relative z-30 here, not just on the dropdowns themselves - animate-nav-pop's entrance
          transform lingers (animation-fill-mode: both keeps it at scale(1)/translateY(0), which
          is still "a transform", not none) and quietly turns this into its own stacking context,
          so without an explicit z-index here the actual stacking order was left up to how that
          context compares to the grid below rather than the dropdown's own z-index. */}
      <div className="relative z-30 flex flex-col gap-2 sm:gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={`font-helvetica flex cursor-pointer items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[10px] tracking-[0.06em] uppercase shadow-xs transition-colors sm:px-4 sm:py-2 sm:text-[12px] ${
              filtersOpen || activeFilterCount > 0 ? "border-[#ea34df] text-[#ea34df]" : "border-black/10 text-[#33322f] hover:border-[#ea34df]/40"
            }`}
          >
            <IconFilter className="size-3 sm:size-3.5" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>

          <span className="font-helvetica text-[10px] tracking-[0.04em] text-[#33322f]/60 uppercase sm:text-[12px]">
            {visible.length} of {projects.length}
          </span>
        </div>

        {filtersOpen && (
          <div className="animate-nav-pop flex flex-wrap items-center gap-2 sm:gap-3">
            <Dropdown
              label="Sort"
              value={sort}
              onChange={(v) => setSort(v as Sort)}
              options={[
                { value: "latest", label: "Latest" },
                { value: "oldest", label: "Oldest" },
                { value: "name", label: "Name A-Z" },
              ]}
            />
            <Dropdown
              label="Type"
              value={type}
              onChange={setType}
              options={[{ value: "all", label: "All types" }, ...types.map((t) => ({ value: t, label: t }))]}
            />
            <Dropdown
              label="Venue"
              value={venue}
              onChange={setVenue}
              options={[{ value: "all", label: "All venues" }, ...venues.map((v) => ({ value: v, label: v }))]}
            />
            <Dropdown
              label="Category"
              value={category}
              onChange={setCategory}
              options={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]}
            />
            <Dropdown
              label="Status"
              value={status}
              onChange={setStatus}
              options={[{ value: "all", label: "All statuses" }, ...statuses.map((s) => ({ value: s, label: s }))]}
            />
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="font-helvetica max-w-[60ch] text-[16px] leading-[1.7] text-[#33322f]">No projects match that filter.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((project) => {
            const categoryList = project.categories ? project.categories.split(",").map((c) => c.trim()).filter(Boolean) : [];

            return (
              <li key={project.id} className="flex h-full flex-col gap-3 rounded-2xl border border-black/10 p-3">
                <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-[#f5f4f0]">
                  {project.coverImage ? (
                    // Cover images are user-submitted, hosted on whatever bucket the Hub app's
                    // upload happened to use - there's no fixed set of hostnames to allow through
                    // next/image's remotePatterns, so a plain <img> is the only thing that works
                    // for arbitrary external sources like this.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.coverImage} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="font-helvetica px-4 text-center text-[12px] text-[#33322f]/40 uppercase">no image</span>
                  )}
                  {project.status && (
                    <span
                      className={`font-helvetica absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] tracking-[0.05em] uppercase ${
                        STATUS_STYLE[project.status] ?? "bg-black/5 text-[#33322f]/70"
                      }`}
                    >
                      {project.status}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-1.5 px-1">
                  <span className="font-nanum-pen truncate text-[19px] leading-[1.2] text-[#0e0e0d]">{project.name}</span>
                  {project.tagline && (
                    <span className="font-helvetica line-clamp-2 text-[13px] leading-[1.4] text-[#33322f]">{project.tagline}</span>
                  )}
                  <span className="font-helvetica text-[11px] leading-[1.4] text-[#33322f]/60">
                    {[project.teamName, project.venueName ?? project.campusName].filter(Boolean).join(" — ")}
                  </span>
                  {categoryList.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {categoryList.map((c) => (
                        <span
                          key={c}
                          className="font-helvetica rounded-full border border-black/10 px-2 py-0.5 text-[9px] tracking-[0.04em] text-[#33322f]/70 uppercase"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {(project.projectUrl || project.sourceCodeUrl) && (
                  <div className="flex flex-wrap gap-2 px-1">
                    {project.projectUrl && (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-helvetica rounded-full bg-[#0e0e0d] px-3 py-1.5 text-[11px] tracking-[0.06em] text-white uppercase transition-transform hover:scale-105"
                      >
                        live
                      </a>
                    )}
                    {project.sourceCodeUrl && (
                      <a
                        href={project.sourceCodeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-helvetica rounded-full border border-black/10 px-3 py-1.5 text-[11px] tracking-[0.06em] text-[#33322f] uppercase transition-transform hover:scale-105"
                      >
                        code
                      </a>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
