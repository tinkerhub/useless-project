"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PEOPLE, type Person } from "../results/data";
import Body, { BODY_POSES, PANTS_COLORS, SHIRT_COLORS, type BodyPose, type GamePose } from "./body";
import { useBrickGame } from "./brick-game";
import { HEAD_FIT } from "./head-fit";
import type { LegoColor } from "@/app/lego-block";

// The same palette the site's dots and tetris blocks use, for heads that don't have a photo yet.
const HEAD_COLORS = ["#ea34df", "#e82803", "#2fc5e8", "#5bd35b", "#8a5cf6", "#ffb020"];

// How big a figure (a head and its drawn body) is: a fixed share of the screen's width and nothing
// else, so the same screen always gets the same size. (It used to also depend on the screen's area,
// which made the size jump around with small changes to the window.) Sizes are of the head image,
// a square with transparent room around the cut-out; the body hangs below it. There's one figure
// per person (see planFill) - comfortably under the ~150 at which the browser stopped drawing the
// page, since every figure is its own floating layer.
const HEAD_MIN_PX = 80;
const HEAD_MAX_PX = 140;
const WIDTH_SHARE = 12.5; // a head image is 1/12.5 of the screen width
// Spacing between figures, as a share of the head image: side by side, neighbours just about touch;
// one above another, a head overlaps only the feet of the figure above it - so every little person
// stays readable rather than melting into one heap.
const STEP_X = 0.8;
const STEP_Y = 1.6;
// Phones: 1/4.4 of the width instead (1/12.5 would be tiny), spaced a touch wider for some room.
const NARROW_PX = 640;
const NARROW_WIDTH_SHARE = 4.4;
const NARROW_STEP_X = 1.05;
const NARROW_FIT = 0.66; // head size as a share of the screen area per person (sqrt), on phones
const NARROW_MIN_PX = 52;
// Random tries per spot when placing people; the one furthest from everyone else wins.
const CANDIDATES = 50;
// Pace: the first heads land slowly, one by one, then it speeds up until the screen is full.
const FIRST_GAP_MS = 280;
const MIN_GAP_MS = 45;
const SPEED_UP = 0.93;
// How long the full crowd stays up, with no game started, before the scroll-on hint shows.
const SCROLL_HINT_AFTER_MS = 4000;
// Give the site's loading splash time to clear before the first head lands.
const START_DELAY_MS = 700;

type Spot = {
  person: Person;
  left: number; // % of the screen
  top: number;
  size: number; // px
  tilt: number; // deg
  floatDuration: number; // s
  floatDelay: number; // s
  layer: number; // stacking order: lower on the screen is drawn in front
  pose: BodyPose;
  shirt: LegoColor;
  pants: LegoColor;
};

// Every shirt / trousers / pose combination (trousers never the shirt's colour), so bodies can be
// dealt out with no two alike until they run out.
const BODY_LOOKS = SHIRT_COLORS.flatMap((shirt) =>
  PANTS_COLORS.filter((pants) => pants !== shirt).flatMap((pants) => BODY_POSES.map((pose) => ({ shirt, pants, pose }))),
);

function shuffle<T>(items: T[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// One spot per person - everyone appears exactly once - scattered over the screen with no rows or
// columns, and spread evenly: each spot is the best of a handful of random tries, the one furthest
// from everyone already placed (distance measured in figure-shaped units, since figures are tall).
// That fills holes wherever they are - including the space hugging the title - instead of leaving
// the random gaps plain darts do. Figures may overlap the edges of `keepClear` (the title's words)
// a little, but never cover much of it. Each figure also gets its own body look from a shuffled
// deck of every combination, and the spots pop in in random order.
function planFill(width: number, height: number, keepClear?: DOMRect): Spot[] {
  const narrow = width < NARROW_PX;
  // A phone has to fit everyone (one each) on one small screen, so there the size also comes down
  // with the number of people - about 65px heads for ~30 people on a typical phone - instead of
  // packing them so tight they pile up.
  const size = narrow
    ? Math.max(NARROW_MIN_PX, Math.min(width / NARROW_WIDTH_SHARE, NARROW_FIT * Math.sqrt((width * height) / PEOPLE.length)))
    : Math.min(HEAD_MAX_PX, Math.max(HEAD_MIN_PX, width / WIDTH_SHARE));
  const baseX = size * (narrow ? NARROW_STEP_X : STEP_X);
  const baseY = size * STEP_Y;

  // Most of what a figure draws, measured from its head's centre: about the head's width across,
  // from the top of the hair to the shins. People stand in front of the title, so this is tested
  // against the words shrunk in only a little on every side - shoes, hair or a hand can nudge into
  // the edge of a letter, but no one stands across the words.
  const clear = keepClear && {
    left: keepClear.left + size * 0.12,
    right: keepClear.right - size * 0.12,
    top: keepClear.top + size * 0.1,
    bottom: keepClear.bottom - size * 0.1,
  };
  const covers = (x: number, y: number) =>
    !!clear &&
    x + size * 0.28 > clear.left &&
    x - size * 0.28 < clear.right &&
    y + size * 1.05 > clear.top &&
    y - size * 0.28 < clear.bottom;

  // Head centres: in from the sides and top far enough that no head is cut off, and down to just
  // above the bottom edge (bodies may run off it).
  const randomSpot = () => ({
    x: size * 0.3 + Math.random() * (width - size * 0.6),
    y: size * 0.35 + Math.random() * (height - size * 0.45),
  });
  const points: { x: number; y: number }[] = [];
  while (points.length < PEOPLE.length) {
    let best: { x: number; y: number } | undefined;
    let bestGap = -1;
    for (let tries = 0; tries < CANDIDATES; tries++) {
      const spot = randomSpot();
      if (covers(spot.x, spot.y)) continue;
      const gap = Math.min(Infinity, ...points.map((p) => Math.hypot((p.x - spot.x) / baseX, (p.y - spot.y) / baseY)));
      if (gap > bestGap) [best, bestGap] = [spot, gap];
    }
    // Every try landed on the title (only possible on a tiny screen): take a plain random spot.
    points.push(best ?? randomSpot());
  }

  const looks = shuffle(BODY_LOOKS);
  const people = shuffle(PEOPLE);
  const spots = points.map(({ x, y }, i): Spot => {
    const person = people[i];
    const floatDuration = 4.5 + Math.random() * 3;
    return {
      person,
      // Lower on the screen stands in front, so a head overlaps the feet above it, not vice versa.
      layer: Math.round(y / (size * 0.25)),
      ...looks[i % looks.length],
      left: (x / width) * 100,
      top: (y / height) * 100,
      size: size * (0.95 + Math.random() * 0.1),
      tilt: (Math.random() - 0.5) * 16,
      floatDuration,
      floatDelay: -Math.random() * floatDuration,
    };
  });
  return shuffle(spots);
}

// The "people behind useless projects" crowd: heads get slapped onto the screen one after another,
// faster and faster, until it's covered - and every one of them keeps floating. Built in the
// browser (it depends on the screen size and is random each visit), so the server renders just the
// title and the heads arrive after load. Shared by the people page and the (parked) section at the
// end of the results page.
export default function PeopleCrowd({
  id,
  heading = "h2",
  edition,
}: {
  id?: string;
  heading?: "h1" | "h2";
  edition?: string;
}) {
  const Heading = heading;
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [shown, setShown] = useState(0);
  const [still, setStill] = useState(false);
  // The title waits for the last figure to land, then pops in on top of the crowd.
  const filled = spots.length > 0 && shown >= spots.length;
  // Find the brick (see brick-game.tsx), offered once everyone has landed.
  const game = useBrickGame(spots, () => ({
    width: sectionRef.current?.clientWidth ?? 0,
    height: sectionRef.current?.clientHeight ?? 0,
  }));
  // A nudge to scroll on to the story: once the crowd has been up a while without a game starting,
  // and again when a game ends. Never during a game, and gone as soon as the page moves.
  const [lingered, setLingered] = useState(false);
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    if (!filled) return;
    const t = setTimeout(() => setLingered(true), SCROLL_HINT_AFTER_MS);
    return () => clearTimeout(t);
  }, [filled]);
  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const gameOver = game.phase === "won" || game.phase === "lost";
  const scrollHint = filled && atTop && (gameOver || (game.phase === "idle" && lingered));

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = () => {
      // Where the title's words sit within the section (they're laid out, just not shown yet), plus
      // a little breathing room around them.
      let keepClear: DOMRect | undefined;
      if (titleRef.current) {
        const s = section.getBoundingClientRect();
        const t = titleRef.current.getBoundingClientRect();
        const pad = 4;
        keepClear = new DOMRect(t.left - s.left - pad, t.top - s.top - pad, t.width + pad * 2, t.height + pad * 2);
      }
      const plan = planFill(section.clientWidth, section.clientHeight, keepClear);
      setSpots(plan);
      if (reduceMotion) {
        // No popping or floating: the filled screen, all at once.
        setStill(true);
        setShown(plan.length);
        return;
      }
      let gap = FIRST_GAP_MS;
      let at = 0;
      plan.forEach((_, i) => {
        timers.push(setTimeout(() => setShown(i + 1), at));
        at += gap;
        gap = Math.max(MIN_GAP_MS, gap * SPEED_UP);
      });
    };

    const begin = () => timers.push(setTimeout(start, START_DELAY_MS));
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin, { once: true });
    return () => {
      window.removeEventListener("load", begin);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    // `isolate` keeps the crowd's stacking (the title at 0, figures 1 and up, a hovered one 90)
    // inside this section, so none of it can climb over the site's menu (z-55) or its dropdown.
    <section
      ref={sectionRef}
      id={id}
      // A wrong guess in find the brick shakes the whole crowd.
      className={`relative isolate h-svh snap-start snap-always min-h-[560px] w-full overflow-hidden ${game.shaking ? "animate-shake" : ""}`}
    >
      {spots.slice(0, shown).map((spot, i) => (
        <div
          key={i}
          title={spot.person.name}
          // During the game everyone stands still and upright (no float, no tilt), so the brick
          // lines up with their hands; while guessing, a click opens that pair of hands.
          className={`group absolute -translate-x-1/2 -translate-y-1/2 transition-[rotate] duration-300 hover:!z-[90] ${
            game.canGuess ? "cursor-pointer" : ""
          } ${game.jiggling ? "fists-jiggle" : ""}`}
          style={{
            left: `${spot.left}%`,
            top: `${spot.top}%`,
            rotate: `${game.playing ? 0 : spot.tilt}deg`,
            zIndex: spot.layer + 1,
            // Each pair of fists starts its shuffle a little apart from the others.
            ["--jig-delay" as string]: `${(i * 53) % 180}ms`,
          }}
          onClick={() => game.guess(i)}
          onMouseEnter={game.hover}
        >
          <div className={still ? undefined : "animate-sticker-pop"}>
            <div
              className={still || game.playing ? undefined : "animate-[float-slow_6s_ease-in-out_infinite]"}
              style={{ animationDuration: `${spot.floatDuration}s`, animationDelay: `${spot.floatDelay}s` }}
            >
              <Figure spot={spot} color={HEAD_COLORS[i % HEAD_COLORS.length]} gamePose={game.poseFor(i)} laughing={game.laughing === i} />
            </div>
          </div>
          {/* The name, shown under the feet while the figure is hovered. */}
          <span
            className="font-nanum-pen pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0e0e0d] px-2 py-0.5 text-[16px] leading-none text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{ top: spot.size * 1.85 }}
          >
            {spot.person.name}
          </span>
        </div>
      ))}
      {/* Behind the people (they stand in front of it), who are kept mostly off the words (see
          planFill), so the title stays readable without any glow. */}
      <Heading
        className={`font-drowner pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 px-4 text-center text-[#0e0e0d] leading-[0.85] select-none ${
          filled ? (still ? "" : "animate-sticker-pop") : "opacity-0"
        }`}
        style={{ fontSize: "clamp(72px, 13vw, 220px)" }}
      >
        {/* Inline-block so it hugs the words - this is what gets measured to keep figures off them.
            During find the brick it steps aside, and the game screen (message, hearts, instructions)
            takes its place - see GameScreen in brick-game.tsx. */}
        <span ref={titleRef} className={`inline-block transition-opacity duration-300 ${game.playing ? "opacity-0" : ""}`}>
          people
          <br />
          behind {edition ?? "useless projects"}
        </span>
      </Heading>
      {filled && game.overlay}
      {/* Above the play button while it is there, at the very bottom once a game has ended. */}
      <div
        aria-hidden={!scrollHint}
        className={`pointer-events-none absolute left-1/2 z-[95] flex -translate-x-1/2 flex-col items-center transition-opacity duration-500 ${
          gameOver ? "bottom-4 md:bottom-6" : "bottom-[84px] md:bottom-[112px]"
        } ${scrollHint ? "opacity-100 delay-700" : "opacity-0"}`}
      >
        <span className="font-nanum-pen text-[22px] leading-none whitespace-nowrap text-[#0e0e0d] md:text-[26px]">scroll for the story</span>
        <svg viewBox="0 0 24 24" className="mt-1 size-6 motion-safe:animate-bounce md:size-7" fill="none" stroke="#0e0e0d" strokeWidth={2.6} strokeLinecap="square" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}

// One figure: a cut-out head on a drawn body joined at its neck, with one soft shadow under the
// whole thing. Without a cut-out, just their photo in a circle, or a coloured placeholder silhouette.
// `gamePose` swaps in the find-the-brick hands (closed or open) while the game is on.
function Figure({ spot, color, gamePose, laughing }: { spot: Spot; color: string; gamePose: GamePose | null; laughing?: boolean }) {
  const { person, size } = spot;
  const pose = gamePose ?? spot.pose;
  // Hidden until the head image has loaded, so a slow or failed image never leaves a headless body.
  const [headLoaded, setHeadLoaded] = useState(false);
  const fit = person.head ? HEAD_FIT[person.head.split("/").pop()!.replace(/\.webp$/, "")] : undefined;
  if (person.head && fit) {
    return (
      <span
        // No hover zoom during the game: it would shift the hands away from the brick.
        className={`relative block transition-transform duration-300 ${gamePose ? "" : "group-hover:scale-110"}`}
        style={{
          width: size,
          height: size,
          filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.22))",
          visibility: headLoaded ? "visible" : "hidden",
        }}
      >
        <Body part="body" pose={pose} shirt={spot.shirt} pants={spot.pants} skin={fit.skin} size={size} neck={fit.neck} />
        <Image
          src={person.head}
          alt={person.name}
          fill
          sizes={`${Math.ceil(size)}px`}
          // Laughing (the one who had the brick, when the player runs out of hearts): the head bobs.
          className={`object-contain ${laughing ? "animate-laugh" : ""}`}
          onLoad={() => setHeadLoaded(true)}
        />
        <Body part="arms" pose={pose} shirt={spot.shirt} pants={spot.pants} skin={fit.skin} size={size} neck={fit.neck} />
      </span>
    );
  }
  return <Head person={person} size={size} color={color} />;
}

function Head({ person, size, color }: { person: Person; size: number; color: string }) {
  // Without a cut-out the circle is drawn smaller, about the size of a cut-out's face.
  const circle = size * 0.6;
  return (
    <span
      className="relative block overflow-hidden rounded-full shadow-sm transition-transform duration-300 group-hover:scale-110"
      style={{ width: circle, height: circle, margin: (size - circle) / 2, backgroundColor: person.photo ? "#d9d9d9" : color }}
    >
      {person.photo ? (
        <Image src={person.photo} alt={person.name} fill sizes={`${Math.ceil(circle)}px`} className="object-cover" />
      ) : (
        // Placeholder: a head-and-shoulders silhouette, so it reads as a person waiting for their
        // photo rather than a stray dot.
        <svg viewBox="0 0 24 24" className="absolute inset-0 size-full text-white/45" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="9.5" r="4.25" />
          <path d="M3.5 24c0-5 3.8-8.5 8.5-8.5s8.5 3.5 8.5 8.5Z" />
        </svg>
      )}
    </span>
  );
}
