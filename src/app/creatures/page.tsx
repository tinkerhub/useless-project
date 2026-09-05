import type { Metadata } from "next";
import Link from "next/link";
import PixelEditor from "./pixel-editor";
import { areCreatureSubmissionsClosed } from "@/lib/creatures";

export const metadata: Metadata = {
  title: "Creatures · Useless Projects",
  description: "Draw a pixel creature and set it loose in the shared gallery.",
};

export default async function CreaturesPage() {
  const closed = await areCreatureSubmissionsClosed();

  return (
    <main data-page="handbook" className="w-full overflow-x-hidden bg-white text-[#0e0e0d]">
      {/* Matches the gallery page's own max-width (1100px) - these two pages are one immediate
          back-and-forth flow via the header buttons on each, and having the header suddenly jump
          to a much narrower column here made the page feel like it belonged to a different site.
          The editor itself (canvas/palette/input) stays centered and its own natural size inside
          this wider column instead of stretching, the same way it already did in the old one. */}
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center gap-8 px-5 py-14 sm:px-8 sm:py-20">
        <header className="flex w-full flex-col items-start gap-3 text-left">
          {/* Same idea as the gallery page's "draw yours" button next to its own heading - the
              reverse trip (drawing -> gallery) deserves an equally obvious button up top, not
              just the one buried in the button row below the canvas alongside "release into the
              wild" (removed from there now that it lives here instead). */}
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            <h1 className="font-drowner leading-[0.95] text-[#0e0e0d]" style={{ fontSize: "clamp(36px, 6vw, 56px)" }}>
              creatures
            </h1>
            <Link
              href="/creatures/gallery"
              className="font-nanum-pen shrink-0 rounded-full bg-[#0e0e0d] px-6 py-2.5 text-[18px] leading-none text-white shadow-lg transition-transform hover:scale-105"
            >
              see gallery
            </Link>
          </div>
          <p className="font-nanum-pen max-w-[46ch] text-[21px] leading-[1.4] text-[#244638] sm:text-[23px]">
            Pixel by pixel, make something weird. Every creature gets released into the shared gallery.
          </p>
        </header>

        {closed ? (
          <p className="font-helvetica max-w-[46ch] text-center text-[15px] leading-[1.6] text-[#33322f]">
            We&apos;re not taking new creatures right now - but the gallery&apos;s still open.
          </p>
        ) : (
          <PixelEditor />
        )}
      </div>
    </main>
  );
}
