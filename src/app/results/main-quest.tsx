"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import ClaimHint from "./claim-hint";
import { MAIN_QUEST_WINNERS, type Winner } from "./data";

// Vertical gap between one card's top and the next, in viewport heights. The cards climb past the
// title as one column-ish track, so this is what sets how many of them share the screen at once.
const SPACING_VH = 32;
const CARD_VH = 60;
// Capped by height as well as width, so a card never outgrows the gap to the next one on its side.
const CARD_WIDTH = "min(42vw, 340px, 40vh)";
const TRACK_VH = (MAIN_QUEST_WINNERS.length - 1) * SPACING_VH + CARD_VH;

// Horizontal offset for each card, as a fraction of the room left over once two cards sit side by
// side. Cards alternate sides (even left, odd right), and any two neighbours' fractions add up to
// less than 1, so a left card and the right card next to it can never overlap at any width.
const LANES = [0.15, 0.3, 0.4, 0.1, 0.25, 0.45, 0.05, 0.35, 0.2, 0.12, 0.38, 0.25, 0.08, 0.3];
const TILTS = [-3, 2, -1.5, 3, -2, 1.5, -3, 2.5, -1, 2, -2.5, 1.5, 3, -2];


// Same "progress written to a custom property" approach as the home page's appam section: the
// scroll handler only sets one number, and the whole track's position is computed from it in CSS.
const PROGRESS = "var(--quest-progress, 0)";

// Laid out after the braille captions mockup: a full-bleed photo, then on plain white the title and
// the handwritten blurb under it. The whole card is the link to the project. Type is sized in
// container units so it keeps the mockup's proportions at any card width.
function WinnerCard({ winner, rank }: { winner: Winner; rank: number }) {
  const card = (
    <article className="@container overflow-hidden bg-white shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
      <div className="relative aspect-[1532/1060] w-full overflow-hidden bg-[#d9d9d9]">
        {winner.photo ? (
          <Image src={winner.photo} alt={winner.project} fill sizes="340px" className="object-cover" />
        ) : (
          <span className="font-drowner absolute inset-0 flex items-center justify-center text-[64px] text-[#0e0e0d]/25">
            {rank}
          </span>
        )}
      </div>
      <div className="px-[5.5cqw] pt-[6cqw] pb-[7cqw]">
        <h3 className="font-helvetica text-[clamp(16px,7.4cqw,32px)] leading-none font-medium tracking-[-0.07em] text-[#0e0e0d] group-hover:underline">
          {winner.project}
        </h3>
        {winner.description && (
          <p className="font-nanum-pen mt-[4cqw] text-[clamp(12px,4.6cqw,20px)] leading-[1.5] text-black">{winner.description}</p>
        )}
      </div>
    </article>
  );

  return winner.url ? (
    <a href={winner.url} target="_blank" rel="noopener noreferrer" className="group pointer-events-auto block transition-transform duration-200 hover:scale-[1.03]">
      {card}
    </a>
  ) : (
    card
  );
}

export default function MainQuest() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const travel = section.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-section.getBoundingClientRect().top, 0), Math.max(travel, 0));
      stage.style.setProperty("--quest-progress", String(travel > 0 ? scrolled / travel : 0));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // At progress 0 the whole track is parked just under the screen, so the first view is the title
  // alone; at 1 the last card has just cleared the top.
  const trackTransform = `translateY(calc(100vh - ${PROGRESS} * (100vh + ${TRACK_VH}vh)))`;

  return (
    // Tall enough that the track scrolls by at roughly the speed of the page itself.
    <section ref={sectionRef} id="main-quest" className="relative w-full bg-white" style={{ height: `${TRACK_VH + 100}vh` }}>
      <div ref={stageRef} className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center px-4 text-center">
          <p className="font-nanum-pen text-[22px] text-black uppercase sm:text-[26px]">main quest</p>
          <h1 className="font-drowner text-[#0e0e0d] leading-[0.85]" style={{ fontSize: "clamp(84px, 17vw, 260px)" }}>
            {/* The handbook's main quest prizes as two stickers hugging the title: the 5L+ fellowship
                and goodies bag left of "quest", Maker Faire Kochi and mentorship right of "winners".
                Sized in em so they scale with the title. */}
            <span className="relative inline-block">
              <span className="absolute top-[0.05em] right-full mr-[0.06em] block aspect-[364/274] h-[0.66em]">
                <Image
                  src="/results/prizes-left.png"
                  alt="Main quest prizes: a 5 lakh fellowship and a goodies bag"
                  fill
                  sizes="220px"
                  className="object-contain"
                />
              </span>
              quest
            </span>
            <br />
            <span className="relative inline-block">
              winners
              <span className="absolute top-[0.08em] left-full ml-[0.04em] block aspect-[274/232] h-[0.66em]">
                <Image
                  src="/results/prizes-right.png"
                  alt="Main quest prizes: a Maker Faire Kochi showcase and mentorship"
                  fill
                  sizes="200px"
                  className="object-contain"
                />
              </span>
            </span>
          </h1>
          <p className="font-nanum-pen mt-4 text-[20px] text-black/60 uppercase">scroll to meet all {MAIN_QUEST_WINNERS.length}</p>
          <ClaimHint className="mt-4" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10" style={{ transform: trackTransform, willChange: "transform" }}>
          {MAIN_QUEST_WINNERS.map((winner, i) => (
            <div
              key={i}
              className="absolute"
              style={
                {
                  width: CARD_WIDTH,
                  top: `${i * SPACING_VH}vh`,
                  [i % 2 === 0 ? "left" : "right"]: `calc(${LANES[i % LANES.length]} * (100% - 2 * ${CARD_WIDTH}))`,
                  rotate: `${TILTS[i % TILTS.length]}deg`,
                } as CSSProperties
              }
            >
              <WinnerCard winner={winner} rank={i + 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
