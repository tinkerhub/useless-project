"use client";

import { useEffect, useMemo, useState } from "react";
import type { Competition } from "@/lib/competitions";

const INPUT_CLASS =
  "font-helvetica w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] text-[#0e0e0d] outline-none transition-colors focus:border-[#ea34df]";

type PickerProject = {
  id: number;
  name: string;
  teamName: string | null;
  campus: string | null;
  link: string | null;
};

export default function ProjectSubmissionForm({ competition }: { competition: Competition }) {
  const [projects, setProjects] = useState<PickerProject[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PickerProject | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/competitions/projects")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: PickerProject[]) => {
        if (!cancelled) setProjects(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !projects) return [];
    return projects
      .filter((project) => [project.name, project.teamName, project.campus].filter(Boolean).join(" ").toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, projects]);

  async function handleSubmit() {
    if (!selected) return;
    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/competitions/submit-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: competition.slug,
          projectId: selected.id,
          projectName: selected.name,
          teamName: selected.teamName ?? undefined,
          campus: selected.campus,
          projectLink: selected.link ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-black/5 bg-[#244638]/5 p-6">
        <p className="font-nanum-pen text-[22px] leading-[1.3] text-[#244638]">Got it - thanks for entering.</p>
        <p className="font-helvetica mt-1 text-[14px] text-[#33322f]">
          We review entries after the hackathon, alongside the other results.
        </p>
      </div>
    );
  }

  return (
    <div className="flex max-w-[440px] flex-col gap-4 rounded-2xl border border-black/5 bg-white p-6 shadow-xs">
      {loadError && (
        <p className="font-helvetica text-[14px] text-[#c0326b]">
          Couldn&apos;t load the project list. Refresh the page and try again.
        </p>
      )}

      {!selected ? (
        <label className="flex flex-col gap-1.5">
          <span className="font-helvetica text-[13px] tracking-[0.04em] text-[#33322f] uppercase">Find your project</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={INPUT_CLASS}
            placeholder={projects === null ? "Loading projects..." : "Search by project or team name"}
            disabled={projects === null}
          />
          {query.trim() && (
            <ul className="mt-1 flex flex-col gap-1 rounded-xl border border-black/10 bg-white p-1">
              {matches.length === 0 && (
                <li className="font-helvetica px-3 py-2 text-[13px] text-[#33322f]/60">No matching project found.</li>
              )}
              {matches.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(project);
                      setQuery("");
                    }}
                    className="font-helvetica flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[#ea34df]/10"
                  >
                    <span className="text-[14px] text-[#0e0e0d]">{project.name}</span>
                    <span className="text-[12px] text-[#33322f]/60">
                      {[project.teamName, project.campus].filter(Boolean).join(" · ") || "No team/campus on record"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-[#f7f6f4] p-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-helvetica text-[11px] tracking-[0.04em] text-[#33322f]/60 uppercase">Project</span>
              <span className="font-helvetica text-[15px] text-[#0e0e0d]">{selected.name}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-helvetica text-[11px] tracking-[0.04em] text-[#33322f]/60 uppercase">Team</span>
              <span className="font-helvetica text-[15px] text-[#0e0e0d]">{selected.teamName ?? "Solo entry"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-helvetica text-[11px] tracking-[0.04em] text-[#33322f]/60 uppercase">Campus</span>
              <span className="font-helvetica text-[15px] text-[#0e0e0d]">{selected.campus ?? "Unknown"}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setStatus("idle");
              setError("");
            }}
            className="font-helvetica self-start text-[13px] text-[#33322f]/60 underline transition-colors hover:text-[#0e0e0d]"
          >
            Not your project? Search again
          </button>
        </div>
      )}

      {status === "error" && <p className="font-helvetica text-[14px] text-[#c0326b]">{error}</p>}

      {selected && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === "submitting"}
          className="font-helvetica mt-1 rounded-full bg-[#0e0e0d] px-5 py-3 text-[13px] tracking-[0.08em] text-white uppercase transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {status === "submitting" ? "Entering..." : `Enter for ${competition.prizeLabel}`}
        </button>
      )}
    </div>
  );
}
