"use client";

import { useMemo, useState, type ReactNode } from "react";
import InstagramEmbed from "../handbook/instagram-embed";
import type { VisibleSubmission } from "@/lib/airtable";

const SELECT_CLASS =
  "font-helvetica rounded-full border border-black/10 bg-white px-4 py-2 text-[12px] tracking-[0.06em] text-[#33322f] uppercase outline-none transition-colors focus:border-[#ea34df]";

function youtubeIdFrom(link: string) {
  try {
    const url = new URL(link);
    if (url.hostname.replace(/^www\./, "") === "youtu.be") return url.pathname.slice(1);
    if (url.hostname.includes("youtube.com")) return url.searchParams.get("v") ?? url.pathname.split("/").pop();
    return null;
  } catch {
    return null;
  }
}

// Instagram's oEmbed widget only recognizes the singular /reel/<id>/ permalink - people commonly
// copy the plural /reels/<id>/ URL from the app's Reels tab instead, which it renders blank.
function normalizeInstagramPermalink(link: string) {
  return link.replace("/reels/", "/reel/");
}

export default function SubmissionsList({ submissions, header }: { submissions: VisibleSubmission[]; header: ReactNode }) {
  const [sort, setSort] = useState<"latest" | "oldest">("latest");
  const [campus, setCampus] = useState<string>("all");

  const campuses = useMemo(
    () => Array.from(new Set(submissions.map((s) => s.campus).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [submissions]
  );

  const visible = useMemo(() => {
    // The submissions prop already arrives newest-first (see listVisibleSubmissions), so
    // "latest" needs no work here - only "oldest" reverses it.
    const ordered = sort === "oldest" ? [...submissions].reverse() : submissions;
    return campus === "all" ? ordered : ordered.filter((s) => s.campus === campus);
  }, [submissions, sort, campus]);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        {header}
        {submissions.length > 0 && (
          <div className="flex flex-nowrap items-center gap-1.5 sm:gap-3">
            <label className="flex min-w-0 items-center gap-1 sm:gap-2">
              <span className="font-helvetica shrink-0 text-[10px] tracking-[0.04em] text-[#33322f]/60 uppercase sm:text-[12px] sm:tracking-[0.06em]">
                Sort
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "latest" | "oldest")}
                className={`${SELECT_CLASS} min-w-0 px-2 py-1 text-[10px] sm:px-4 sm:py-2 sm:text-[12px]`}
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </select>
            </label>
            <label className="flex min-w-0 items-center gap-1 sm:gap-2">
              <span className="font-helvetica shrink-0 text-[10px] tracking-[0.04em] text-[#33322f]/60 uppercase sm:text-[12px] sm:tracking-[0.06em]">
                Venue
              </span>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className={`${SELECT_CLASS} min-w-0 max-w-[110px] px-2 py-1 text-[10px] sm:max-w-[220px] sm:px-4 sm:py-2 sm:text-[12px]`}
              >
                <option value="all">All venues</option>
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="font-helvetica max-w-[60ch] text-[16px] leading-[1.7] text-[#33322f]">
          {submissions.length === 0 ? "Nothing here yet." : "No submissions for that venue yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-8 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
          {visible.map((submission) => {
            const isInstagram = submission.link.includes("instagram.com");
            const youtubeId = isInstagram ? null : youtubeIdFrom(submission.link);
            return (
              <li key={submission.id} className="flex min-w-0 max-w-[280px] flex-col gap-2">
                <span className="font-nanum-pen block max-w-full min-w-0 leading-[1.3] break-words text-[16px] text-[#0e0e0d]">
                  {submission.name} <span className="text-[#33322f]/60">— {submission.campus}</span>
                </span>
                {isInstagram ? (
                  <InstagramEmbed permalink={normalizeInstagramPermalink(submission.link)} scale={0.6} />
                ) : youtubeId ? (
                  <div className="relative aspect-video w-full max-w-[280px] overflow-hidden rounded-xl border border-black/5">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={submission.name}
                      className="absolute inset-0 size-full"
                      frameBorder={0}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    href={submission.link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-helvetica w-fit shrink-0 rounded-full bg-[#0e0e0d] px-5 py-2 text-[13px] tracking-[0.08em] text-white uppercase transition-transform hover:scale-105"
                  >
                    open
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
