import type { Metadata } from "next";
import Link from "next/link";
import PixelEditor from "./pixel-editor";

export const metadata: Metadata = {
  title: "Creatures · Useless Projects",
  description: "Draw a pixel creature and set it loose in the shared gallery.",
};

export default function CreaturesPage() {
  return (
    <main data-page="handbook" className="w-full overflow-x-hidden bg-white text-[#0e0e0d]">
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-8 px-5 py-14 sm:px-8 sm:py-20">
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-drowner leading-[0.95] text-[#0e0e0d]" style={{ fontSize: "clamp(36px, 6vw, 56px)" }}>
            creatures
          </h1>
          <p className="font-nanum-pen max-w-[46ch] text-[21px] leading-[1.4] text-[#244638] sm:text-[23px]">
            Pixel by pixel, make something weird. Every creature gets released into the shared gallery.
          </p>
          <Link
            href="/creatures/gallery"
            className="font-helvetica text-[12px] tracking-[0.06em] text-[#33322f] uppercase underline underline-offset-4"
          >
            see the gallery
          </Link>
        </header>

        <PixelEditor />
      </div>
    </main>
  );
}
