import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BadgeFallback from "../badge-fallback";
import { COMPETITIONS } from "@/lib/competitions";

export const metadata: Metadata = {
  title: "Competitions · Useless Projects",
  description: "Side-quest competitions running alongside Useless Projects, and how to submit for each.",
};

export default function CompetitionsIndexPage() {
  return (
    <main data-page="handbook" className="w-full overflow-x-hidden bg-white text-[#0e0e0d]">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-8 px-5 py-14 sm:px-8 sm:py-20">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-drowner leading-[0.95] text-[#0e0e0d]" style={{ fontSize: "clamp(36px, 6vw, 56px)" }}>
              competitions
            </h1>
            <Link
              href="/submissions"
              className="font-helvetica w-fit shrink-0 rounded-lg bg-[#0e0e0d] px-4 py-1.5 text-[11px] tracking-[0.08em] text-white uppercase transition-transform hover:scale-105 sm:px-5 sm:py-2 sm:text-[13px]"
            >
              see submissions
            </Link>
          </div>
          <p className="font-nanum-pen max-w-[52ch] text-[21px] leading-[1.4] text-[#244638] sm:text-[23px]">
            Side quests, and how to submit for each one.
          </p>
        </header>

        {/* Same medal layout the handbook's side-quest prizes use (image slot, label, description,
            outlined "know more" pill) rather than a bordered card grid - so a competition reads
            the same whether you land on it from the handbook or browse here directly. */}
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 sm:gap-x-8 md:grid-cols-4 lg:grid-cols-5">
          {COMPETITIONS.map((competition) => (
            <li key={competition.slug} className="flex min-w-0 flex-col items-start gap-2.5 text-left">
              <Link
                href={`/competitions/${competition.slug}`}
                className="group flex w-full flex-col items-start gap-2.5 transition-transform hover:scale-[1.04]"
              >
                {/* Fixed slot whether it's a real badge image or the fallback seal, so a
                    competition without art yet doesn't sit at a different height than its
                    neighbours. Tags overlay the top of it as small chips rather than taking up
                    their own row below - constrained to the column's own width (inset-x-0, not
                    just left-0) so a long tag wraps instead of overflowing into the next column. */}
                <div className="relative flex w-full items-center justify-center" style={{ height: 150 }}>
                  {(competition.venueExclusive || !competition.autoJudged) && (
                    <span className="absolute inset-x-0 top-0 flex flex-col items-start gap-1">
                      {competition.venueExclusive && (
                        <span className="font-helvetica rounded-full bg-[#244638] px-2 py-0.5 text-[9px] tracking-[0.05em] text-white uppercase">
                          venue exclusive
                        </span>
                      )}
                      {!competition.autoJudged && (
                        <span className="font-helvetica rounded-full bg-[#ea34df] px-2 py-0.5 text-[9px] tracking-[0.05em] text-white uppercase">
                          submit entry
                        </span>
                      )}
                    </span>
                  )}
                  {competition.image ? (
                    // Source badges run much larger than this 110px slot - next/image resizes
                    // and re-compresses instead of shipping the full file to every card here.
                    <div className="relative" style={{ width: 110, height: 110 }}>
                      <Image src={competition.image} alt="" aria-hidden="true" fill sizes="110px" className="object-contain" />
                    </div>
                  ) : (
                    <BadgeFallback size={92} />
                  )}
                </div>

                <span
                  className="font-nanum-pen min-h-[2.6em] text-[21px] leading-[1.1] text-[#0e0e0d]"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}
                >
                  {competition.prizeLabel}
                </span>

                <span className="font-helvetica line-clamp-2 min-h-[2.9em] text-[12px] leading-[1.4] font-bold text-[#33322f]">
                  {competition.prizeText}
                </span>

                <span className="font-helvetica mt-1 inline-flex items-center gap-1 rounded-full border border-[#ea34df] px-3 py-1 text-[10px] font-bold tracking-[0.05em] text-[#ea34df] uppercase transition-colors group-hover:bg-[#ea34df] group-hover:text-white">
                  know more
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
