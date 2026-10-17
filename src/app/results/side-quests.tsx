import type { CSSProperties } from "react";
import Image from "next/image";
import { HoverDot } from "../hover-dot";
import { getCompetition } from "@/lib/competitions";
import {
  AFTERMOVIE_WINNERS,
  COMPETITION_WINNERS,
  DOCUMENTARY_WINNERS,
  JOURNAL_WINNERS,
  type QuestEntry,
  type QuestPerson,
  type VenueWinner,
} from "./data";

const DOT_ASSETS = ["/why-dot.svg", "/hero-dot-1.svg", "/hero-dot-2.svg", "/hero-dot-3.svg", "/hero-dot-4.svg"] as const;

// For faces without a photo - the site's dot/tetris palette, picked from the name so a person keeps
// the same color everywhere they appear on the page.
const INITIAL_COLORS = ["#ea34df", "#2fc5e8", "#5bd35b", "#8a5cf6", "#ffb020", "#e82803"];
const initialColor = (name: string) => INITIAL_COLORS[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % INITIAL_COLORS.length];

// Plain <img> for the people photos: they're already shrunk to 160px WebPs (see data.ts), so there's
// nothing left for next/image to optimise.
function Face({ person, size }: { person: QuestPerson; size: number }) {
  return person.photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={person.photo}
      alt={person.name}
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

// `className` (sizing classes) takes over from `size` when given, for badges that change size with
// the screen; `size` still sets the image's `sizes` hint.
function Badge({ slug, size, className }: { slug: string; size: number; className?: string }) {
  const image = getCompetition(slug)?.image;
  if (!image) return null;
  return (
    <div className={`relative shrink-0 ${className ?? ""}`} style={className ? undefined : { width: size, height: size }}>
      <Image src={image} alt="" aria-hidden="true" fill sizes={`${size}px`} className="object-contain" />
    </div>
  );
}

// A small white note that pops above whatever it's attached to on hover - the parent needs `group`
// and `relative`. Used on the film frames, where there's no room to print the details.
function HoverNote({ title, detail }: { title: string; detail?: string }) {
  return (
    <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-40 w-max max-w-[220px] -translate-x-1/2 translate-y-1 rounded-xl border border-black/5 bg-white px-3.5 py-2 text-left opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100">
      <span className="font-helvetica block text-[14px] leading-tight font-bold tracking-[-0.03em] text-[#0e0e0d]">{title}</span>
      {detail && <span className="font-nanum-pen mt-0.5 block text-[16px] leading-[1.1] text-black/60">{detail}</span>}
      <span className="absolute top-full left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b border-black/5 bg-white" />
    </span>
  );
}

// A photo filling whatever box it's given, or the person's initial on their colour when there's no
// photo on record.
function Photo({ person, className = "" }: { person: QuestPerson; className?: string }) {
  return person.photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={person.photo} alt={person.name} loading="lazy" className={`object-cover ${className}`} />
  ) : (
    <span
      className={`font-drowner flex items-center justify-center text-white ${className}`}
      style={{ backgroundColor: initialColor(person.name) }}
    >
      {person.name[0]}
    </span>
  );
}

// The sprocket holes along a strip of film - a row of small rounded gaps, drawn as a repeating
// background so the row is as long as the strip without counting holes.
const SPROCKETS: CSSProperties = {
  backgroundImage: "linear-gradient(90deg, #f4f4f3 0 9px, transparent 9px 18px)",
  backgroundSize: "18px 100%",
};

// Build documentary: the three winners as frames on a strip of film, tilted a touch. Names run under
// the strip; the project and campus show on hover over a frame.
function FilmStrip({ entries }: { entries: QuestEntry[] }) {
  return (
    <div className="w-full max-w-[250px] -rotate-2 pt-4 md:max-w-[330px] md:pt-6">
      <div className="rounded-[6px] bg-[#141413] px-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
        <div aria-hidden="true" className="h-[7px] translate-y-[4px] rounded-[2px] opacity-90" style={SPROCKETS} />
        <ul className="flex gap-2 py-3">
          {entries.map((entry) => (
            <li key={entry.url} className="group relative flex-1">
              <HoverNote title={entry.project?.toLowerCase() ?? "build documentary"} detail={entry.campus.toLowerCase()} />
              <a href={entry.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-[3px]">
                <Photo
                  person={entry}
                  className="aspect-[4/5] w-full text-[34px] grayscale-[35%] transition-[filter,transform] duration-300 group-hover:scale-105 group-hover:grayscale-0"
                />
              </a>
            </li>
          ))}
        </ul>
        <div aria-hidden="true" className="h-[7px] -translate-y-[4px] rounded-[2px] opacity-90" style={SPROCKETS} />
      </div>
      <ul className="mt-2 flex gap-2 px-2.5">
        {entries.map((entry) => (
          <li key={entry.url} className="font-nanum-pen flex-1 truncate text-center text-[15px] leading-none text-[#0e0e0d] md:text-[17px]">
            {entry.name.split(" ")[0].toLowerCase()}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Project journal: a page torn from a notebook - ruled lines, a red margin, a strip of tape on top -
// with each winner written in as an entry. There's room on the page for the details, so nothing
// hides behind a hover here.
function JournalPage({ entries }: { entries: QuestEntry[] }) {
  return (
    <div className="relative w-full max-w-[270px] rotate-[1.5deg] pt-4 md:max-w-[320px] md:pt-6">
      <span
        aria-hidden="true"
        className="absolute top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 -rotate-3 bg-[#ffe27a]/80 shadow-sm"
      />
      <ul
        className="relative rounded-[4px] bg-white py-5 pr-4 pl-12 text-left shadow-[0_10px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 34px, #f2a7a7 34px 35px, transparent 35px), repeating-linear-gradient(transparent 0 31px, #cfe0f5 31px 32px)",
          backgroundPositionY: "0, 12px",
        }}
      >
        {entries.map((entry) => (
          <li key={entry.url}>
            <a href={entry.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 py-2">
              <Photo person={entry} className="size-9 shrink-0 rounded-full text-[15px] ring-2 ring-white md:size-11 md:text-[18px]" />
              <span className="min-w-0">
                <span className="font-nanum-pen block text-[18px] leading-[1.05] text-[#0e0e0d] group-hover:underline md:text-[21px]">
                  {entry.name.toLowerCase()}
                  {entry.project && <span className="text-[#3d5ae0]"> - {entry.project.toLowerCase()}</span>}
                </span>
                <span className="font-nanum-pen block truncate text-[13px] leading-[1.1] text-black/50 md:text-[15px]">{entry.campus.toLowerCase()}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const TICKET_TILTS = [-4, 3, -2];
const TICKET_COLORS = ["#fff1c9", "#ffdff7", "#dff4ff"];

// Venue after-movie: a fanned stack of cinema tickets, one per winning campus - a stub with "admit
// one" down it, then the campus cutout and its name. Each ticket opens that campus's after-movie.
function TicketStack({ venues }: { venues: VenueWinner[] }) {
  return (
    <ul className="flex w-full max-w-[270px] flex-col items-center pt-4 md:max-w-[320px] md:pt-6">
      {venues.map((venue, i) => (
        <li
          key={venue.url}
          className={`relative w-full transition-transform duration-200 hover:z-10 hover:-translate-y-1 hover:rotate-0 ${i > 0 ? "-mt-1" : ""}`}
          style={{ rotate: `${TICKET_TILTS[i % TICKET_TILTS.length]}deg` }}
        >
          <a
            href={venue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[78px] overflow-hidden rounded-[10px] md:h-[96px] shadow-[0_8px_18px_rgba(0,0,0,0.14)] ring-1 ring-black/5"
            style={{ backgroundColor: TICKET_COLORS[i % TICKET_COLORS.length] }}
          >
            <span className="font-helvetica flex w-9 shrink-0 items-center justify-center border-r-2 border-dashed border-black/15 text-[9px] font-bold tracking-[0.2em] text-black/45 uppercase [writing-mode:vertical-rl] rotate-180">
              admit one
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={venue.image} alt="" aria-hidden="true" loading="lazy" className="h-full w-[92px] shrink-0 object-contain object-bottom p-1.5 md:w-[118px]" />
            <span className="flex min-w-0 flex-col justify-center pr-3 text-left">
              <span className="font-drowner text-[24px] leading-none text-[#0e0e0d] md:text-[30px]">{venue.venue.toLowerCase()}</span>
              <span className="font-nanum-pen mt-1 text-[12px] leading-[1.1] text-black/55 md:text-[14px]">{venue.fullName.toLowerCase()}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

// On phones, where the three stack in one column, each block leans to one `side` so they zigzag down
// the page: the whole block shifts that way, and its badge and label line up with that edge of the
// winners below (and sit closer to them) instead of floating centred. Side by side from md up,
// everything is centred again.
function SingleQuest({ slug, label, side, children }: { slug: string; label: string; side: "left" | "right"; children: React.ReactNode }) {
  const lean = side === "left" ? "-translate-x-[8%]" : "translate-x-[8%]";
  const align = side === "left" ? "items-start text-left" : "items-end text-right";
  return (
    <div className={`flex flex-col items-center gap-2 md:translate-x-0 ${lean}`}>
      <div className={`-mb-2 flex w-full max-w-[270px] flex-col gap-1 px-2 md:mb-0 md:max-w-none md:items-center md:gap-2 md:px-0 md:text-center ${align}`}>
        <Badge slug={slug} size={104} className="size-[68px] md:size-[104px]" />
        <p className="font-nanum-pen text-[20px] leading-none text-[#0e0e0d] md:text-[24px]">{label}</p>
      </div>
      {children}
    </div>
  );
}

export default function SideQuests() {
  return (
    <section id="side-quests" className="relative flex min-h-screen w-full snap-start snap-always flex-col items-center justify-center gap-14 overflow-hidden px-4 py-24 sm:px-8">
      <HoverDot assets={DOT_ASSETS} baseIndex={2} size={28} className="absolute top-24 right-[12%] hidden sm:block" />
      <HoverDot assets={DOT_ASSETS} baseIndex={0} size={18} className="absolute top-40 left-[10%] hidden sm:block" />
      <HoverDot assets={DOT_ASSETS} baseIndex={3} size={22} className="absolute bottom-24 left-[16%] hidden sm:block" />

      <div className="text-center">
        <p className="font-nanum-pen text-[22px] text-black uppercase sm:text-[26px]">for specific things done well</p>
        <h2 className="font-drowner text-[#0e0e0d] leading-[0.9]" style={{ fontSize: "clamp(64px, 10vw, 150px)" }}>
          side quests
        </h2>
      </div>

      <div className="grid w-full max-w-[1100px] grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
        <SingleQuest slug="best-build-video-documentary" label="build documentary" side="left">
          <FilmStrip entries={DOCUMENTARY_WINNERS} />
        </SingleQuest>
        <SingleQuest slug="journal-repo" label="project journal" side="right">
          <JournalPage entries={JOURNAL_WINNERS} />
        </SingleQuest>
        <SingleQuest slug="venue-aftermovie" label="venue after-movie" side="left">
          <TicketStack venues={AFTERMOVIE_WINNERS} />
        </SingleQuest>
      </div>

      {/* Category winners as the handbook's medal tiles: badge, label, the project, the faces
          behind it, and the outlined pink pill. */}
      <ul className="flex w-full max-w-[1100px] flex-wrap justify-center gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12">
        {COMPETITION_WINNERS.map((winner) => (
          <li key={winner.slug} className="w-[calc(50%-8px)] sm:w-[200px]">
            <a
              href={winner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col items-center gap-1 text-center transition-transform hover:scale-[1.04] sm:gap-1.5"
            >
              <span className="relative">
                <Badge slug={winner.slug} size={110} className="size-[76px] sm:size-[110px]" />
                {/* Winners' faces stuck onto the badge's corner like stickers - each one's name pops
                    up over it on hover. */}
                <span className="absolute -right-4 -bottom-2 flex -space-x-3 sm:-right-6">
                  {winner.members.map((member) => (
                    <span key={member.name} className="group/face relative hover:z-10">
                      <Face person={member} size={36} />
                      <span className="font-nanum-pen pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 translate-y-1 rounded-full bg-[#0e0e0d] px-2.5 py-1 text-[14px] leading-none whitespace-nowrap text-white opacity-0 transition-[opacity,translate] duration-150 group-hover/face:translate-y-0 group-hover/face:opacity-100">
                        {member.name.toLowerCase()}
                      </span>
                    </span>
                  ))}
                </span>
              </span>
{/* Tiles in a row stretch to the same height and the pill sits at the bottom (mt-auto), so
                  pills line up across a row without padding short names out with blank lines. */}
              <span className="font-nanum-pen mt-1.5 text-[15px] leading-[1.1] text-black/60 sm:mt-2 sm:text-[18px]">{winner.category}</span>
              <span className="font-helvetica text-[16px] leading-[1.2] font-bold tracking-[-0.04em] text-[#0e0e0d] sm:text-[19px]">
                {winner.project}
              </span>
              <span className="font-nanum-pen text-[14px] leading-[1.1] mb-1.5 text-[#244638] sm:text-[16px]">{winner.campus.toLowerCase()}</span>
              <span className="font-helvetica mt-auto inline-flex items-center rounded-full border border-[#ea34df] px-3 py-1 text-[10px] font-bold tracking-[0.05em] text-[#ea34df] uppercase transition-colors group-hover:bg-[#ea34df] group-hover:text-white">
                see project
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
