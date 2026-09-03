import type { Metadata } from "next";
import Link from "next/link";
import { listVisibleSubmissions } from "@/lib/airtable";
import { COMPETITIONS } from "@/lib/competitions";
import SubmissionsList from "./submissions-list";

export const metadata: Metadata = {
  title: "Submissions · Useless Projects",
  description: "Everything submitted across the Useless Projects competitions.",
};

export default async function SubmissionsPage() {
  // Auto-judged prizes (best hardware/finished project, local LLMs) have no separate submission
  // table - they're judged straight off the normal project submission, so there's nothing here to list.
  const sections = await Promise.all(
    COMPETITIONS.filter((competition) => competition.airtableTableId).map(async (competition) => ({
      competition,
      submissions: await listVisibleSubmissions(competition.airtableTableId!),
    }))
  );

  return (
    <main data-page="handbook" className="w-full overflow-x-hidden bg-white text-[#0e0e0d]">
      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-14 px-5 py-14 sm:px-8 sm:py-20">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-drowner leading-[0.95] text-[#0e0e0d]" style={{ fontSize: "clamp(36px, 6vw, 56px)" }}>
              submissions
            </h1>
            <Link
              href="/competitions"
              className="font-helvetica w-fit shrink-0 rounded-lg bg-[#0e0e0d] px-4 py-1.5 text-[11px] tracking-[0.08em] text-white uppercase transition-transform hover:scale-105 sm:px-5 sm:py-2 sm:text-[13px]"
            >
              submit your own
            </Link>
          </div>
          <p className="font-nanum-pen max-w-[52ch] text-[21px] leading-[1.4] text-[#244638] sm:text-[23px]">
            Everything submitted across every competition.
          </p>
        </header>

        {sections.map(({ competition, submissions }) => (
          <section key={competition.slug} className="flex flex-col gap-5">
            <SubmissionsList
              submissions={submissions}
              header={
                <h2 className="font-drowner leading-[0.95] text-[#0e0e0d]" style={{ fontSize: "clamp(24px, 4vw, 34px)" }}>
                  {competition.prizeLabel}
                </h2>
              }
            />
          </section>
        ))}
      </div>
    </main>
  );
}
