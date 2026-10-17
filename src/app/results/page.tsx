import type { Metadata } from "next";
import Image from "next/image";
import LoopingVideo from "./looping-video";
import MainQuest from "./main-quest";
import { CLOSING_VIDEO, NOTE, PEOPLE } from "./data";
import SideQuests from "./side-quests";

export const metadata: Metadata = {
  title: "Results",
  description: "The Useless Projects 3.0 results - main quest winners, side quest winners, and the people behind it all.",
};

// The same palette the site's dots and tetris blocks use, for heads that don't have a photo yet.
const HEAD_COLORS = ["#ea34df", "#e82803", "#2fc5e8", "#5bd35b", "#8a5cf6", "#ffb020"];

// Tiny seeded PRNG so the crowd is scattered the same way on the server and the client (and on
// every visit) - Math.random here would be a hydration mismatch.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Heads go on a loose grid with each one nudged off its cell, so they read as a crowd rather than a
// table but never pile up on top of each other.
function scatterHeads(count: number) {
  const rand = seeded(7);
  const cols = 8;
  const rows = Math.ceil(count / cols);
  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      left: ((col + 0.5 + (rand() - 0.5) * 0.7) / cols) * 100,
      top: ((row + 0.5 + (rand() - 0.5) * 0.6) / rows) * 100,
      size: 0.75 + rand() * 0.55,
      tilt: (rand() - 0.5) * 16,
      color: HEAD_COLORS[Math.floor(rand() * HEAD_COLORS.length)],
    };
  });
}

const HEADS = scatterHeads(PEOPLE.length);

// The "people behind useless projects" crowd is parked until the real faces are in - flip this back
// on to show it between the side quests and the note.
const SHOW_PEOPLE = false;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-nanum-pen text-[22px] text-black uppercase sm:text-[26px]">{children}</p>;
}

export default function ResultsPage() {
  return (
    // data-page opts out of the home page's scroll snapping (see globals.css). overflow-x-clip
    // rather than -hidden: hidden would make <main> a scroll container and break the sticky stage
    // the main quest section scrolls its winners through.
    <main data-page="handbook" className="w-full overflow-x-clip bg-white text-[#0e0e0d]">
      <MainQuest />

      <SideQuests />

      {SHOW_PEOPLE && (
      <section id="people" className="relative flex min-h-screen w-full items-center justify-center overflow-hidden py-24">
        {/* Painted first so every head sits on top of it - the words peek out from behind the crowd. */}
        <h2
          className="font-drowner pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 text-center text-[#0e0e0d]/[0.18] leading-[0.85] select-none"
          style={{ fontSize: "clamp(72px, 13vw, 220px)" }}
        >
          people behind
          <br />
          useless projects
        </h2>
        <div className="relative h-[80vh] w-full max-w-[1300px]">
          {PEOPLE.map((person, i) => {
            const head = HEADS[i];
            return (
              <div
                key={i}
                title={person.name}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${head.left}%`, top: `${head.top}%`, rotate: `${head.tilt}deg` }}
              >
                <span
                  className="relative block overflow-hidden rounded-full shadow-sm transition-transform duration-300 group-hover:scale-125"
                  style={{
                    width: `calc(${head.size} * clamp(44px, 7vw, 92px))`,
                    height: `calc(${head.size} * clamp(44px, 7vw, 92px))`,
                    backgroundColor: person.photo ? "#d9d9d9" : head.color,
                  }}
                >
                  {person.photo && <Image src={person.photo} alt={person.name} fill sizes="120px" className="object-cover" />}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      )}

      <section id="note" className="flex w-full items-center justify-center px-8 pt-40 pb-24 sm:px-16 sm:pt-48 sm:pb-28">
        <div className="w-full max-w-[720px]">
          <SectionLabel>{NOTE.title}</SectionLabel>
          <div className="mt-10 flex flex-col gap-8">
            {NOTE.paragraphs.map((p, i) => (
              <p key={i} className="font-nanum-pen text-[24px] leading-[1.55] text-[#121211] sm:text-[28px]">
                {p}
              </p>
            ))}
          </div>
          <p className="font-nanum-pen mt-12 text-[26px] text-[#ea34df]">{NOTE.signoff}</p>
        </div>
      </section>

      {/* The last thing on the page: the closing video, cropped to its footage and looping like a GIF.
          The box takes the crop's shape; the video inside is scaled up and shifted so only the crop
          shows through. */}
      <section id="video" className="flex w-full flex-col items-center px-4 pt-4 pb-28 sm:px-8">
        {/* The video stays centred on its own; the handwritten sign-off hangs off its right edge on
            wide screens (absolutely, so it never pushes the video off centre) and sits under it on
            narrower ones. */}
        <div className="relative w-full max-w-[1240px]">
          <div
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: `${CLOSING_VIDEO.crop.width} / ${CLOSING_VIDEO.crop.height}` }}
          >
            <LoopingVideo
              src={CLOSING_VIDEO.src}
              className="pointer-events-none absolute max-w-none"
              style={{
                width: `${(CLOSING_VIDEO.width / CLOSING_VIDEO.crop.width) * 100}%`,
                height: `${(CLOSING_VIDEO.height / CLOSING_VIDEO.crop.height) * 100}%`,
                left: `${(-CLOSING_VIDEO.crop.x / CLOSING_VIDEO.crop.width) * 100}%`,
                top: `${(-CLOSING_VIDEO.crop.y / CLOSING_VIDEO.crop.height) * 100}%`,
              }}
            />
          </div>
          <p className="font-nanum-pen mt-2 mr-1 -rotate-3 text-right text-[17px] leading-[1.05] text-[#ea34df] sm:text-[22px] min-[1600px]:mr-0 min-[1600px]:-rotate-6 min-[1600px]:absolute min-[1600px]:top-1/2 min-[1600px]:left-full min-[1600px]:mt-0 min-[1600px]:ml-5 min-[1600px]:w-[120px] min-[1600px]:-translate-y-1/2 min-[1600px]:text-left min-[1600px]:text-[26px]">
            {CLOSING_VIDEO.sideNote}
          </p>
        </div>
      </section>
    </main>
  );
}
