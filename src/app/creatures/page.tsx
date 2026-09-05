import type { Metadata } from "next";
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
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-8 px-5 py-14 sm:px-8 sm:py-20">
        <header className="flex w-full flex-col items-start gap-3 text-left">
          <h1 className="font-drowner leading-[0.95] text-[#0e0e0d]" style={{ fontSize: "clamp(36px, 6vw, 56px)" }}>
            creatures
          </h1>
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
