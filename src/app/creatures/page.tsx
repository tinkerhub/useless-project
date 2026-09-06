import type { Metadata } from "next";
import CreaturesFlow from "./creatures-flow";
import { areCreatureSubmissionsClosed } from "@/lib/creatures";

export const metadata: Metadata = {
  title: "Creatures · Useless Projects",
  description: "Draw a pixel creature and set it loose in the shared gallery.",
};

export default async function CreaturesPage() {
  const closed = await areCreatureSubmissionsClosed();

  return (
    // Matches the gallery page's own max-width (1100px) - these two pages are one immediate
    // back-and-forth flow via the header buttons on each, and having the header suddenly jump to
    // a much narrower column here made the page feel like it belonged to a different site. The
    // actual layout (drawing header + editor, vs. the released share screen) lives in
    // CreaturesFlow, since which of those two shows up is client state.
    <main data-page="handbook" className="w-full overflow-x-hidden bg-white text-[#0e0e0d]">
      <CreaturesFlow closed={closed} />
    </main>
  );
}
