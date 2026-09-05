"use client";

import { useGalleryBigMessage } from "./live-creatures";

// A full-width bar above everything else on the page - meant to be the first thing seen (a venue
// change, "judging starts in 10 minutes"), not something that has to compete with the heading or
// get spotted among the creatures. Renders nothing at all when there's no message, rather than an
// empty reserved bar, so it never leaves a blank gap on the far more common "nothing posted" case.
export default function GalleryBigMessage() {
  const message = useGalleryBigMessage();
  if (!message) return null;

  return (
    <div className="w-full bg-[#0e0e0d] px-5 py-4 text-center sm:px-8">
      <p className="font-nanum-pen mx-auto max-w-[1100px] text-[22px] leading-[1.3] text-white sm:text-[28px]">
        {message}
      </p>
    </div>
  );
}
