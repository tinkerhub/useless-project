"use client";

import { useLiveCreatures } from "./live-creatures";

export default function GalleryCount() {
  const creatures = useLiveCreatures();
  return (
    <p className="font-nanum-pen max-w-[52ch] text-[21px] leading-[1.4] text-[#244638] sm:text-[23px]">
      {creatures.length === 0
        ? "Nobody's drawn one yet - be the first."
        : `${creatures.length} creature${creatures.length === 1 ? "" : "s"}, brought to life by all of you.`}
    </p>
  );
}
