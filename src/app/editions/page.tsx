import type { Metadata } from "next";
import Link from "next/link";
import { CURRENT_EDITION, allEditions, editionHome } from "@/lib/editions";

export const metadata: Metadata = {
  title: "Editions",
  description: "Every year of Useless Projects.",
};

export default function EditionsPage() {
  return (
    // data-page turns the root layout's scroll snapping off, same as the other document pages.
    <main data-page="handbook" className="w-full overflow-x-hidden bg-white text-[#0e0e0d]">
      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-10 px-5 py-14 sm:px-8 sm:py-20">
        <header className="flex flex-col gap-3">
          <h1 className="font-drowner leading-[0.95] text-[#0e0e0d]" style={{ fontSize: "clamp(36px, 6vw, 56px)" }}>
            editions
          </h1>
          <p className="font-nanum-pen max-w-[52ch] text-[21px] leading-[1.4] text-[#244638] sm:text-[23px]">
            Every year of Useless Projects, newest first.
          </p>
        </header>

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {allEditions().map((edition) => {
            const body = (
              <>
                <span className="font-drowner leading-[1] text-[#0e0e0d]" style={{ fontSize: "clamp(40px, 6vw, 56px)" }}>
                  {edition.slug}
                </span>
                <span className="font-helvetica text-[13px] tracking-[0.08em] text-[#33322f] uppercase">{edition.year}</span>
                <span className="font-nanum-pen text-[20px] leading-[1.2] text-[#244638]">
                  {!edition.live ? "coming back soon" : edition.slug === CURRENT_EDITION ? "this year" : "see what happened"}
                </span>
              </>
            );
            return (
              <li key={edition.slug}>
                {edition.live ? (
                  <Link
                    href={editionHome(edition.slug)}
                    className="flex h-full flex-col gap-2 rounded-xl border border-black/10 p-6 transition-transform hover:scale-[1.03] hover:border-[#ea34df]"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex h-full flex-col gap-2 rounded-xl border border-dashed border-black/20 p-6 opacity-60">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
