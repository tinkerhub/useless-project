import type { CSSProperties } from "react";
import Image from "next/image";
import { HoverDot } from "../hover-dot";
import ClaimHint from "./claim-hint";
import { getCompetition } from "@/lib/competitions";
import {
  AFTERMOVIE_WINNERS,
  COMPETITION_WINNERS,
  DOCUMENTARY_WINNERS,
  JOURNAL_WINNERS,
  type QuestEntry,
  type QuestPerson,
} from "./data";

const DOT_ASSETS = ["/why-dot.svg", "/hero-dot-1.svg", "/hero-dot-2.svg", "/hero-dot-3.svg", "/hero-dot-4.svg"] as const;

// For faces without a photo - the site's dot/tetris palette, picked from the name so a person keeps
// the same color everywhere they appear on the page.
const INITIAL_COLORS = ["#ea34df", "#2fc5e8", "#5bd35b", "#8a5cf6", "#ffb020", "#e82803"];
const initialColor = (name: string) => INITIAL_COLORS[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % INITIAL_COLORS.length];

// Plain <img> rather than next/image for the people/project photos: they're hotlinked from the
// event's S3 bucket, and their keys don't always end in an image extension.
function Face({ person, size }: { person: QuestPerson; size: number }) {
  return person.photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={person.photo}
      alt={person.name}
      title={person.name}
      loading="lazy"
      className="shrink-0 rounded-full object-cover ring-[3px] ring-white"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      title={person.name}
      className="font-drowner flex shrink-0 items-center justify-center rounded-full text-white ring-[3px] ring-white"
      style={{ width: size, height: size, fontSize: size * 0.45, backgroundColor: initialColor(person.name) }}
    >
      {person.name[0]}
    </span>
  );
}

function Badge({ slug, size }: { slug: string; size: number }) {
  const image = getCompetition(slug)?.image;
  if (!image) return null;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <Image src={image} alt="" aria-hidden="true" fill sizes={`${size}px`} className="object-contain" />
    </div>
  );
}

// Winners as a row of big photos with a short name underneath. Anything more (project, campus)
// only appears in a little note above the photo on hover, so the row stays mostly pictures.
type Tile = {
  key: string;
  url: string;
  label: string;
  image?: string;
  note?: { title: string; detail?: string };
  shape: "round" | "cutout";
};

// Each tile tilts a little and overlaps its neighbours, like photos dropped on a table - the middle
// one on top so none of the three is mostly hidden. Hovering one straightens it and brings it to
// the front.
const TILE_TILTS = [-6, 4, -3];

function TileRow({ tiles }: { tiles: Tile[] }) {
  return (
    <ul className="flex w-full items-end justify-center pt-4">
      {tiles.map((tile, i) => (
        <li
          key={tile.key}
          className={`group relative z-[var(--z)] min-w-0 flex-1 basis-0 hover:z-30 ${tile.shape === "round" ? "-ml-5 max-w-[124px]" : "-ml-14 max-w-[210px]"} first:ml-0`}
          style={{ "--z": tiles.length - Math.abs(i - (tiles.length - 1) / 2) } as CSSProperties}
        >
          {/* Sits on the (untilted) list item rather than inside the tilted, scaling link, so the
              note always reads straight and at its own size. */}
          {tile.note && (
            <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-40 w-max max-w-[220px] -translate-x-1/2 translate-y-1 rounded-xl border border-black/5 bg-white px-3.5 py-2 text-left opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100">
              <span className="font-helvetica block text-[14px] leading-tight font-bold tracking-[-0.03em] text-[#0e0e0d]">{tile.note.title}</span>
              {tile.note.detail && (
                <span className="font-nanum-pen mt-0.5 block text-[16px] leading-[1.1] text-black/60">{tile.note.detail}</span>
              )}
              <span className="absolute top-full left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b border-black/5 bg-white" />
            </span>
          )}
          <a
            href={tile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex rotate-[var(--rot)] flex-col items-center gap-2 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-0"
            style={{ "--rot": `${TILE_TILTS[i % TILE_TILTS.length]}deg` } as CSSProperties}
          >
            {tile.shape === "cutout" ? (
              // Sky already cut out of these, so no frame - the building itself is the shape.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tile.image}
                alt={tile.label}
                loading="lazy"
                className="h-auto w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.25)]"
              />
            ) : (
              <span
                className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-full shadow-md ring-4 ring-white"
                style={tile.image ? undefined : { backgroundColor: initialColor(tile.label) }}
              >
                {tile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tile.image} alt={tile.label} loading="lazy" className="size-full object-cover" />
                ) : (
                  <span className="font-drowner text-[44px] text-white">{tile.label[0]}</span>
                )}
              </span>
            )}
            <span className="font-nanum-pen w-full truncate text-center text-[19px] leading-none text-[#0e0e0d]">
              {tile.label}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

const personTiles = (entries: QuestEntry[]): Tile[] =>
  entries.map((entry) => ({
    key: entry.url,
    url: entry.url,
    label: entry.name.split(" ")[0].toLowerCase(),
    image: entry.photo,
    note: { title: entry.name, detail: [entry.project?.toLowerCase(), entry.campus.toLowerCase()].filter(Boolean).join(" · ") },
    shape: "round",
  }));

function SingleQuest({ slug, label, tiles }: { slug: string; label: string; tiles: Tile[] }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Badge slug={slug} size={104} />
      <p className="font-nanum-pen text-[24px] leading-none text-[#0e0e0d]">{label}</p>
      <TileRow tiles={tiles} />
    </div>
  );
}

export default function SideQuests() {
  return (
    <section id="side-quests" className="relative flex min-h-screen w-full flex-col items-center justify-center gap-14 overflow-hidden px-4 py-24 sm:px-8">
      <HoverDot assets={DOT_ASSETS} baseIndex={2} size={28} className="absolute top-24 right-[12%] hidden sm:block" />
      <HoverDot assets={DOT_ASSETS} baseIndex={0} size={18} className="absolute top-40 left-[10%] hidden sm:block" />
      <HoverDot assets={DOT_ASSETS} baseIndex={3} size={22} className="absolute bottom-24 left-[16%] hidden sm:block" />

      <div className="text-center">
        <p className="font-nanum-pen text-[22px] text-black uppercase sm:text-[26px]">side quests</p>
        <h2 className="font-drowner text-[#0e0e0d] leading-[0.9]" style={{ fontSize: "clamp(64px, 10vw, 150px)" }}>
          side quests
        </h2>
        <ClaimHint className="mt-4" />
      </div>

      <div className="grid w-full max-w-[1100px] grid-cols-1 gap-12 md:grid-cols-3 md:gap-6">
        <SingleQuest slug="best-build-video-documentary" label="build documentary" tiles={personTiles(DOCUMENTARY_WINNERS)} />
        <SingleQuest slug="journal-repo" label="project journal" tiles={personTiles(JOURNAL_WINNERS)} />
        <SingleQuest
          slug="venue-aftermovie"
          label="venue after-movie"
          tiles={AFTERMOVIE_WINNERS.map((w) => ({ key: w.url, url: w.url, label: w.venue.split(" ")[0].toLowerCase(), image: w.image, note: { title: w.venue }, shape: "cutout" }))}
        />
      </div>

      {/* Category winners as the handbook's medal tiles: badge, label, the project, the faces
          behind it, and the outlined pink pill. */}
      <ul className="flex w-full max-w-[1100px] flex-wrap justify-center gap-x-6 gap-y-12">
        {COMPETITION_WINNERS.map((winner) => (
          <li key={winner.slug} className="w-[calc(50%-12px)] sm:w-[200px]">
            <a
              href={winner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2 text-center transition-transform hover:scale-[1.04]"
            >
              <span className="relative">
                <Badge slug={winner.slug} size={110} />
                {/* Winners' faces stuck onto the badge's corner like stickers. */}
                <span className="absolute -right-6 -bottom-2 flex -space-x-3">
                  {winner.members.map((member) => (
                    <Face key={member.name} person={member} size={40} />
                  ))}
                </span>
              </span>
              <span className="font-nanum-pen mt-2 text-[18px] leading-[1.1] text-black/60">{winner.category}</span>
              <span className="font-helvetica text-[19px] leading-tight font-bold tracking-[-0.04em] text-[#0e0e0d]">{winner.project}</span>
              <span className="font-helvetica mt-1 inline-flex items-center rounded-full border border-[#ea34df] px-3 py-1 text-[10px] font-bold tracking-[0.05em] text-[#ea34df] uppercase transition-colors group-hover:bg-[#ea34df] group-hover:text-white">
                see project
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
