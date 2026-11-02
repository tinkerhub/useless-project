"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import HoverFrames from "../handbook/hover-frames";
import { LEGO_COLORS } from "@/app/lego-block";
import { VENUES } from "@/app/venues";
import { PEOPLE } from "../results/data";
import { CAMPUS, HELPERS, MAKERS, NOTE, STICKER, STORY_END, TEAMS, type StoryMedia, type Team } from "./story-data";

// After the crowd: a note, stuck on the page like a handwritten letter, saying the most important
// part of it all was the people - then every team on one screen (who planned, who built the site,
// who designed the goodies...), then the volunteers huddled together with the packing photos and
// videos sliding sideways as you scroll, the campus leads with every venue pinned to a notice board,
// and the makers. Everything pops in as it scrolls into view. (No apostrophes in the comments here:
// Tailwind reads an unmatched one as the start of a string and silently skips the classes after it.)

const BY_NAME = new Map(PEOPLE.map((p) => [p.name, p]));
const VOLUNTEERS = PEOPLE.filter((p) => p.group === "volunteers");
// Volunteers whose photo is in but whose name is not yet; their heads show without a caption.
const UNNAMED = "volunteer";
// The same huddle of creatures as the handbook (who helps you: your venue, the community, the campus
// team, the foundation team), signing off the note. Each overlaps the last; the 2nd and 3rd stand a
// step forward. Hover one and it steps out, grows and says who it is.
const NOTE_CREATURES = [
  { label: "your venue", image: "/ele1.webp" },
  { label: "the tinkerhub community", image: "/ele3a.webp", hoverFrames: ["/ele3a.webp", "/ele3b.webp", "/ele3c.webp"] },
  { label: "campus team", image: "/ele4.webp" },
  { label: "foundation team", image: "/ele5a.webp" },
];
const CROWD_Z = [1, 3, 2, 1];
const CROWD_FRONT_CLASS = ["", "translate-y-2 scale-110", "translate-y-1 scale-105", ""];

// Each photo in a pile gets its own small tilt, so they look dropped on a table.
const TILTS = [-2.5, 2, -1.5];

// True once the element has scrolled (mostly) into view; stays true.
function useShown<T extends Element>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown] as const;
}

// Fades and slides its children up the first time they scroll into view.
function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [ref, shown] = useShown<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Story() {
  return (
    <section aria-label="The story" className="px-4 md:px-10">
      {/* The note gets a screen of its own, centred, and the page snaps to it after the crowd. */}
      <div className="flex min-h-svh snap-start snap-always items-center justify-center py-16">
        <Note />
      </div>
      {/* Then every team, together on one screen. */}
      <div className="flex min-h-svh snap-start snap-always items-center justify-center py-16">
        <Teams />
      </div>
      {/* Each part below is its own snap point. Parts taller than the screen (the photo strip, the
          notice board on a phone) are scrolled through freely, then the page snaps on. */}
      <div className="flex min-h-svh snap-start snap-always flex-col items-center justify-center py-16 text-center">
        <Reveal className="mx-auto w-full max-w-4xl">
          <Chapter title={HELPERS.title} text={HELPERS.text} />
          {/* Everyone huddled together. */}
          <Crowd people={VOLUNTEERS} className="mx-auto mt-8 max-w-sm md:mt-10 md:max-w-lg" />
        </Reveal>
      </div>
      <ScrollStrip media={HELPERS.media} />
      <div className="flex min-h-svh snap-start flex-col items-center justify-center py-16 text-center">
        <Reveal className="mx-auto w-full max-w-4xl">
          <Chapter title={CAMPUS.title} text={CAMPUS.text} />
        </Reveal>
        <NoticeBoard className="mt-8 mb-12 md:mt-12 md:mb-16" />
      </div>
      {/* The end, on a screen of its own. */}
      <div className="flex min-h-svh snap-start snap-always flex-col items-center justify-center gap-6 text-center md:gap-10">
        <Reveal>
          <Chapter title={MAKERS.title} />
        </Reveal>
        <Reveal>
          <p className="font-drowner leading-[0.9]" style={{ fontSize: "clamp(48px, 8vw, 120px)" }}>
            {STORY_END}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// The note: a sheet of plain white paper with a strip of tape, tilted a little, all handwritten, the
// last line in bold.
function Note() {
  return (
    <Reveal className="mx-auto w-full max-w-2xl">
      <div className="relative -rotate-1 border border-[#0e0e0d]/[0.06] bg-white px-5 pt-10 pb-8 shadow-[0_12px_32px_rgba(0,0,0,0.12)] md:px-12 md:pt-10 md:pb-8">
        <span aria-hidden="true" className="absolute -top-3 right-6 h-7 w-24 rotate-2 bg-[#0e0e0d]/[0.07] md:right-auto md:left-1/2 md:w-28 md:-translate-x-1/2" />
        {/* The creature huddle stands on the top edge of the note, clear of the tape (and on phones, of the menu button). */}
        <ul className="absolute bottom-full left-5 flex items-end md:right-10 md:left-auto">
          {NOTE_CREATURES.map((item, n) => (
            <li
              key={item.label}
              className={`group relative -ml-3 origin-bottom transition-transform duration-200 first:ml-0 hover:z-10 hover:scale-125 ${CROWD_FRONT_CLASS[n]}`}
              style={{ zIndex: CROWD_Z[n] }}
            >
              {item.hoverFrames ? (
                <HoverFrames frames={item.hoverFrames} className="h-12 w-12 object-contain md:h-[80px] md:w-[80px]" />
              ) : (
                <span className="relative block h-12 w-12 md:h-[80px] md:w-[80px]">
                  <Image src={item.image} alt="" aria-hidden="true" fill sizes="80px" className="object-contain" />
                </span>
              )}
              <span className="font-nanum-pen pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-[18px] whitespace-nowrap text-[#0e0e0d] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
        {NOTE.lines.map((line, i) => (
          <p key={i} className="font-nanum-pen mt-3 text-[21px] leading-[1.15] md:mt-4 text-[#244638] first:mt-0 md:text-[27px]">
            {line}
          </p>
        ))}
        {/* What it all comes down to, said last, in the same hand as the rest. */}
        <h2 className="font-nanum-pen mt-3 text-[21px] leading-[1.15] md:mt-4 font-bold text-[#244638] md:text-[27px]">{NOTE.closing}</h2>
      </div>
    </Reveal>
  );
}

// Every team on one screen: what they did, in a few words, with their heads under it.
function Teams() {
  return (
    // Rows that wrap and centre (rather than a grid), so a last row of two sits in the middle.
    <div className="flex w-full max-w-[1600px] flex-wrap justify-center gap-x-10 gap-y-7 md:gap-y-14 xl:gap-y-20">
      {TEAMS.map((team) => (
        <Reveal key={team.title} className="w-full md:w-[calc(50%-20px)] lg:w-[calc(33.333%-27px)]">
          <TeamCell team={team} />
        </Reveal>
      ))}
    </div>
  );
}

function TeamCell({ team }: { team: Team }) {
  const people = team.people.flatMap((name) => BY_NAME.get(name) ?? []);
  return (
    <div className="flex flex-col items-center text-center">
      <h3 className="font-drowner leading-[0.95]" style={{ fontSize: "clamp(26px, 3.6vw, 64px)" }}>
        {team.title}
      </h3>
      <div className="mt-3 flex items-center justify-center md:mt-5">
        <Heads people={people} className="shrink-0 flex-nowrap" />
        {team.more && <span className="font-nanum-pen ml-1 text-[18px] leading-none whitespace-nowrap text-[#244638] md:text-[22px] xl:text-[26px]">{team.more}</span>}
      </div>
    </div>
  );
}

// A row of cut-out heads standing close together, each with its name under it, wrapping onto more
// rows when there are many. Heads without a name yet get an empty caption line, so rows stay level.
function Heads({ people, className = "" }: { people: typeof PEOPLE; className?: string }) {
  return (
    <div className={`flex items-end justify-center gap-y-2 ${className.includes("flex-nowrap") ? "" : "flex-wrap"} ${className}`}>
      {people.map((person, n) => (
        <figure key={`${person.name}-${n}`} className="flex w-14 flex-col items-center md:w-[80px] lg:w-[90px] xl:w-[104px]">
          <span className="relative block size-[52px] md:size-[76px] lg:size-[86px] xl:size-[100px]">
            {person.head && (
              <Image src={person.head} alt="" fill sizes="(min-width: 1280px) 100px, 86px" className="object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.2)]" />
            )}
          </span>
          <figcaption className="font-nanum-pen mt-1 h-4 text-center text-[15px] leading-none whitespace-nowrap text-[#244638] md:h-5 md:text-[19px] xl:h-6 xl:text-[22px]">
            {person.name === UNNAMED ? "" : person.name}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

// A crowd, like a group photo: three staggered rows, the back row smaller and higher, the front row
// biggest and lowest and drawn on top, every head overlapping its neighbours and tipped a little its
// own way. Positions are in % of the box, so it scales with the screen. Hover a head for the name.
const CROWD_ROWS = 3;
const ROW_SCALE = [0.8, 0.9, 1];
// A fixed shuffle (the same every load, so nobody moves between server and browser render).
const crowdOrder = (n: number) =>
  Array.from({ length: n }, (_, i) => i).sort((a, b) => ((a * 7919) % 101) - ((b * 7919) % 101));

function Crowd({ people, className = "" }: { people: typeof PEOPLE; className?: string }) {
  // Rows alternate one fewer and one more, so each sits in the gaps of the row in front.
  const perRow = Math.ceil((people.length + 1) / CROWD_ROWS);
  const counts: number[] = [];
  let left = people.length;
  for (let r = 0; r < CROWD_ROWS; r++) {
    const want = r === CROWD_ROWS - 1 ? left : Math.min(left, r % 2 === 0 ? perRow - 1 : perRow);
    counts.push(want);
    left -= want;
  }
  const head = (100 / perRow) * 1.5; // % of the box width; wider than a slot, so neighbours overlap
  const step = head * 0.34; // each row hides most of the row behind it, shoulder to shoulder
  const height = step * (CROWD_ROWS - 1) + head + 8; // % of width, plus room for the front row names
  const order = crowdOrder(people.length);
  let next = 0;
  const spots = counts.flatMap((count, r) =>
    Array.from({ length: count }, (_, c) => {
      const person = people[order[next++]];
      const offset = (perRow - count) / 2; // centre a shorter row
      const jitter = ((next * 37) % 9) - 4;
      return {
        person,
        r,
        left: ((c + offset + 0.5) / perRow) * 100 + jitter * 0.3,
        top: (step * r + jitter * 0.25) / height * 100,
        tilt: ((next * 53) % 13) - 6,
      };
    }),
  );
  return (
    <div className={`relative w-full ${className}`} style={{ aspectRatio: `100 / ${height}` }}>
      {spots.map(({ person, r, left: x, top, tilt }, n) => (
        <figure
          key={`${person.name}-${n}`}
          className="group absolute -translate-x-1/2 transition-transform duration-200 hover:z-40 hover:scale-110"
          style={{ left: `${x}%`, top: `${top}%`, width: `${head * ROW_SCALE[r]}%`, zIndex: r * 10 + 1, rotate: `${tilt}deg` }}
        >
          <span className="relative block aspect-square">
            {person.head && (
              <Image src={person.head} alt={person.name === UNNAMED ? "A volunteer" : person.name} fill sizes="96px" className="object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.22)]" />
            )}
          </span>
          {person.name !== UNNAMED && (
            <figcaption className="font-nanum-pen pointer-events-none absolute top-full left-1/2 -translate-x-1/2 bg-[#0e0e0d] px-1.5 py-0.5 text-[14px] leading-none whitespace-nowrap text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 md:text-[16px]">
              {person.name}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

// Every venue, pinned up like postcards on a cork notice board in a wooden frame (with the TinkerHub
// sticker slapped across its corner): each a little print
// with the campus name under it, tipped and nudged its own way, overlapping its neighbours a touch,
// with a coloured pin through the top. Hover one to lift it off the board. Venues that ran in both
// slots show once.
const CAMPUSES = VENUES.filter((v, i) => VENUES.findIndex((w) => w.name === v.name) === i);
const PIN_COLORS = Object.entries(LEGO_COLORS)
  .filter(([name]) => name !== "cream")
  .map(([, colour]) => colour);

function NoticeBoard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative left-1/2 w-[calc(100vw-24px)] max-w-[1200px] -translate-x-1/2 border-[10px] border-[#8f6136] p-2 shadow-[inset_0_2px_12px_rgba(0,0,0,0.35),0_16px_36px_rgba(0,0,0,0.18)] md:border-[16px] md:p-5 ${className}`}
      style={{
        backgroundColor: "#c79764",
        backgroundImage:
          "radial-gradient(rgba(70,40,10,0.22) 1px, transparent 1.6px), radial-gradient(rgba(255,240,210,0.18) 1px, transparent 1.6px)",
        backgroundSize: "7px 7px, 11px 11px",
        backgroundPosition: "0 0, 3px 5px",
      }}
    >
      {/* The TinkerHub sticker, slapped across the bottom corner of the board, hanging off the frame. */}
      <TogetherSticker className="absolute right-1 -bottom-12 z-30 w-36 rotate-[8deg] md:-right-4 md:-bottom-20 md:w-64" />
      <ul className="flex flex-wrap justify-center">
        {CAMPUSES.map((venue, i) => (
          <li
            key={venue.name}
            className="relative w-1/5 p-0.5 transition-transform duration-200 hover:z-20 hover:scale-150 hover:rotate-0 sm:w-1/6 md:w-[12.5%] md:p-1.5 lg:w-[10%]"
            style={{ rotate: `${((i * 53) % 13) - 6}deg`, translate: `${((i * 29) % 7) - 3}px ${((i * 41) % 9) - 4}px` }}
          >
            <div className="bg-[#fffdf8] p-[3px] pb-0.5 shadow-[0_3px_6px_rgba(0,0,0,0.3)] md:p-1.5 md:pb-1">
              <span className="relative block aspect-[4/3] overflow-hidden bg-[#f1f0ea]">
                <Image src={venue.image} alt={venue.name} fill sizes="(min-width: 1024px) 120px, 20vw" className="object-cover" />
              </span>
              <span className="font-nanum-pen block truncate pt-px text-center text-[11px] leading-tight text-[#244638] md:text-[14px]">
                {venue.name}
              </span>
            </div>
            <span
              aria-hidden="true"
              className="absolute top-0 left-1/2 size-2 -translate-x-1/2 rounded-full shadow-[0_2px_2px_rgba(0,0,0,0.45)] md:top-0.5 md:size-3"
              style={{ background: PIN_COLORS[i % PIN_COLORS.length] }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// The TinkerHub "Together, we make it better." sticker, slapped on as it scrolls into view - dropping
// in big and tilted, squashing flat, and settling a little crooked. Where it goes and how big it is
// come from `className`.
function TogetherSticker({ className = "" }: { className?: string }) {
  const [ref, shown] = useShown<HTMLDivElement>();
  return (
    <div ref={ref} className={className}>
      <span
        className={`relative block w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.18)] transition-transform duration-300 hover:scale-105 ${
          shown ? "animate-sticker-slap" : "opacity-0"
        }`}
      >
        <Image src={STICKER.src} alt={STICKER.alt} width={600} height={322} sizes="(min-width: 768px) 256px, 160px" className="block h-auto w-full" />
      </span>
    </div>
  );
}

function Chapter({ title, text }: { title: string; text?: string }) {
  return (
    <>
      <h3 className="font-drowner leading-[0.95]" style={{ fontSize: "clamp(30px, 4.4vw, 56px)" }}>
        {title}
      </h3>
      {text && <p className="font-nanum-pen mx-auto mt-3 max-w-2xl text-[22px] leading-[1.2] text-[#244638] md:mt-4 md:text-[28px]">{text}</p>}
    </>
  );
}

// The packing photos and videos, side by side in one long strip that slides sideways as the page
// scrolls down: the strip holds still on screen (sticky) while a tall box scrolls past it, and how
// far through that box the page is decides how far along the strip is. Moved straight on the
// element, not through React state, so it keeps up with the scroll.
function ScrollStrip({ media }: { media: StoryMedia[] }) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = () => {
      const box = outer.current;
      const strip = track.current;
      if (!box || !strip) return;
      const travel = box.offsetHeight - window.innerHeight;
      const along = travel > 0 ? Math.min(1, Math.max(0, -box.getBoundingClientRect().top / travel)) : 0;
      const shift = Math.max(0, strip.scrollWidth - window.innerWidth);
      strip.style.transform = `translate3d(${-shift * along}px, 0, 0)`;
    };
    move();
    window.addEventListener("scroll", move, { passive: true });
    window.addEventListener("resize", move);
    return () => {
      window.removeEventListener("scroll", move);
      window.removeEventListener("resize", move);
    };
  }, []);
  return (
    // Its own snap point: the page settles with the strip filling the screen, then scrolls freely
    // through it (a snap area taller than the screen), sliding the photos along.
    <div
      ref={outer}
      className="relative left-1/2 w-screen -translate-x-1/2 snap-start"
      style={{ height: `calc(100svh + ${media.length * 50}svh)` }}
    >
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <div ref={track} className="flex items-center gap-6 px-[8vw] will-change-transform md:gap-12">
          {media.map((m, n) => (
            <div key={n} className={`w-[82vw] shrink-0 md:w-[52vw] lg:w-[46vw] ${n % 2 ? "translate-y-6 md:translate-y-12" : "-translate-y-4 md:-translate-y-8"}`}>
              <MediaCard media={m} tilt={TILTS[n % TILTS.length]} wide />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// A muted looping video that only plays while it is on screen (and does not load until it nearly
// is). With `crop`, the video is scaled up and shifted so just that part of the frame fills the card.
function StoryVideo({ src, crop }: { src: string; crop?: [number, number, number, number] }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);
  const [x, y, w, h] = crop ?? [0, 0, 1, 1];
  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="none"
      className={`absolute max-w-none ${crop ? "object-fill" : "inset-0 size-full object-cover"}`}
      style={crop ? { width: `${100 / w}%`, height: `${100 / h}%`, left: `${(-x / w) * 100}%`, top: `${(-y / h) * 100}%` } : undefined}
    />
  );
}

// A photo stuck down like a print: white border, a soft shadow, a small tilt, a handwritten caption.
function MediaCard({ media, tilt, big, wide }: { media: StoryMedia; tilt: number; big?: boolean; wide?: boolean }) {
  return (
    <figure
      className="relative bg-white p-2 pb-1 shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition-transform duration-300 hover:scale-[1.03] hover:rotate-0 md:p-3 md:pb-2"
      style={{ rotate: `${tilt}deg` }}
    >
      <div className={`relative w-full overflow-hidden bg-[#f1f0ea] ${wide || (media.kind === "video" && media.crop) ? "aspect-video" : big ? "aspect-[16/10]" : "aspect-[4/5]"}`}>
        {media.kind === "image" && (
          <Image src={media.src} alt={media.alt} fill sizes="(min-width: 768px) 720px, 90vw" className="object-cover" />
        )}
        {media.kind === "video" && <StoryVideo src={media.src} crop={media.crop} />}
        {media.kind === "placeholder" && (
          // An empty frame until the real photo comes in.
          <div className="absolute inset-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#0e0e0d]/20">
            <svg viewBox="0 0 24 24" className="size-8 md:size-10" fill="none" stroke="#0e0e0d" strokeOpacity={0.35} strokeWidth={2} aria-hidden="true">
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            <span className="font-helvetica px-2 text-center text-[11px] tracking-[0.08em] text-[#33322f]/50 uppercase">photo coming soon</span>
          </div>
        )}
      </div>
      {media.caption && (
        <figcaption className="font-nanum-pen truncate pt-1 text-center text-[18px] leading-tight text-[#244638] md:text-[20px]">{media.caption}</figcaption>
      )}
    </figure>
  );
}
