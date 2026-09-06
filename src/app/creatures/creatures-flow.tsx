"use client";

import { useState } from "react";
import Link from "next/link";
import PixelEditor from "./pixel-editor";
import ShareCard from "./share-card";

type Released = { name: string; pixels: (string | null)[] };

// Owns the idle/released split so the two screens can be genuinely different views rather than
// one stacked on top of the other - the share screen used to render below this same header
// ("creatures" + "see gallery" button + drawing subtitle), which meant a gallery link and a
// "you're about to share something" message appearing twice on one page. Lifting the released
// state up here means the share screen replaces this header entirely instead of piling under it.
export default function CreaturesFlow({ closed }: { closed: boolean }) {
  const [released, setReleased] = useState<Released | null>(null);

  if (released) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-[1100px] flex-col items-center justify-center gap-4 px-5 py-6 text-center">
        <ShareCard name={released.name} pixels={released.pixels} onDrawAnother={() => setReleased(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center gap-8 px-5 py-14 sm:px-8 sm:py-20">
      <header className="flex w-full flex-col items-start gap-3 text-left">
        {/* Column on mobile, row from sm: up - a same-line button here landed right against the
            fixed "menu" pill (top-3 right-3 in site-nav.tsx) whenever "creatures" alone left
            enough width not to force a wrap on its own, so the two visibly touched. */}
        <div className="flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <PixelEditor onReleased={(name, pixels) => setReleased({ name, pixels })} />
      )}
    </div>
  );
}
