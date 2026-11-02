"use client";

import { useEffect, useRef, useState } from "react";
import type { Person } from "../results/data";
import { HANDS_AT, type GamePose } from "./body";
import { HEAD_FIT } from "./head-fit";
import { setMuted, sfx, unlock } from "./sfx";

// Find the brick: a big lego brick pops up in the middle of the screen, flies into someone's hands,
// and is passed from hand to hand - always to someone nearby, so it can be followed - getting
// quicker each time, until it vanishes into the fists of whoever got it last. The player has three
// hearts; clicking someone opens their hands. Wrong: the screen shakes and a heart breaks. Right:
// confetti. Every step has its own sound (see sfx.ts). (No apostrophes in the comments here:
// Tailwind reads an unmatched one as the start of a string and silently skips the classes after it.)

const PASSES = 20;
const FIRST_PASS_MS = 280;
const FASTEST_PASS_MS = 75;
const PASS_SPEED_UP = 0.85;
// The trick: this many passes before the end, the brick splits into identical copies that are passed
// along their own routes at the same time. Only one is real - follow it from before the split.
const DECOYS = 2;
const DECOY_PASSES = 8;
const NEARBY = 5; // the brick goes to one of the few people nearest the holder
const HEARTS = 3;
const OPEN_MS = 900; // how long a wrong guess keeps its hands open
const BAR_CLEARANCE_PX = 110; // hands this close to the bottom are behind the game buttons
const INTRO_MS = 800; // the big brick in the middle, before it flies to the first person
const FLY_IN_MS = 400;
const PASS_GAP_MS = 25; // the brick rests in each pair of hands this long before the next pass
const FLASH_MS = 1000; // how long a quick message (nope!) shows before the main one comes back
// The hide: the brick vanishes the moment it lands in the last pair of hands (no pause there to give
// it away), and straight away everyone shuffles their fists for a moment, so the last holder does not
// stand out as the only hands that just moved.
const SHUFFLE_MS = 750;
// A bright yellow that none of the shirts use, with a dark outline, so the brick stands out against
// every shirt colour (a red brick vanished on red shirts).
const BRICK = "#FFD60A";
const BRICK_EDGE = "#0e0e0d";
const CONFETTI = ["#E82803", "#5C3095", "#06C3FB", "#14B73E", "#F68729", "#EA34DF", "#FFD60A"];

// What the game needs to know about a figure on screen.
export type GameFigure = { person: Person; left: number; top: number; size: number };

type Phase = "idle" | "shuffling" | "guessing" | "won" | "lost";
type Tone = "info" | "bad" | "good";
type Flash = { text: string; tone: Tone; key: number };

const headSlug = (person: Person) => person.head?.split("/").pop()?.replace(/\.webp$/, "");
const INTRO = -1; // brickAt value for the big brick in the middle of the screen

export function useBrickGame(figures: GameFigure[], area: () => { width: number; height: number }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [holder, setHolder] = useState(0);
  const [brickAt, setBrickAt] = useState<number | null>(null);
  const [brickShown, setBrickShown] = useState(false);
  const [decoysAt, setDecoysAt] = useState<number[]>([]);
  const [pass, setPass] = useState({ step: 0, ms: FIRST_PASS_MS });
  const [hearts, setHearts] = useState(HEARTS);
  const [opened, setOpened] = useState<number | null>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [flashed, setFlashed] = useState<Flash | null>(null);
  const [shaking, setShaking] = useState(false);
  const [jiggling, setJiggling] = useState(false);
  const [confetti, setConfetti] = useState<{ x: number; y: number; key: number } | null>(null);
  const [muted, setMutedState] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastTick = useRef(0);
  // Fresh keys for messages and confetti bursts, so each one restarts its animation (and two made in
  // the same moment never share a key).
  const nextKey = useRef(0);
  const newKey = () => ++nextKey.current;

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
  const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // A quick message (nope!) over the main one for a moment.
  const flash = (text: string, tone: Tone) => {
    const key = newKey();
    setFlashed({ text, tone, key });
    later(FLASH_MS, () => setFlashed((f) => (f?.key === key ? null : f)));
  };

  // Where a figure holds things, in px within the play area.
  const handsAt = (i: number, pose: GamePose, width: number, height: number) => {
    const f = figures[i];
    const fit = HEAD_FIT[headSlug(f.person) ?? ""];
    if (!fit) return null;
    const unit = f.size / 100;
    const [hx, hy] = HANDS_AT[pose];
    return {
      x: (f.left / 100) * width + (fit.neck[0] - 0.5) * f.size + hx * unit,
      y: (f.top / 100) * height + (fit.neck[1] - 0.5) * f.size + hy * unit,
    };
  };

  // Who takes part: figures with a cut-out head (so they have hands), whose hands are on screen and
  // clear of the game buttons at the bottom - someone standing at the bottom edge has theirs below it
  // or behind the buttons, where the brick could not be followed.
  const playersIn = (width: number, height: number) =>
    figures
      .map((f, i) => {
        const at = handsAt(i, "hold", width, height);
        return at && at.y < height - BAR_CLEARANCE_PX && at.x > 0 && at.x < width ? i : -1;
      })
      .filter((i) => i >= 0);

  function start() {
    clearTimers();
    unlock();
    const { width, height } = area();
    const players = playersIn(width, height);
    if (players.length < 2) return;
    setBox({ width, height });
    const at = (i: number) => [(figures[i].left / 100) * width, (figures[i].top / 100) * height];

    // The next stop on a route: one of the people nearest the current holder (never straight back
    // to the one it just came from, nor anyone in the taken list if that leaves a choice).
    const next = (here: number, before: number | undefined, taken: number[]) => {
      const [hx, hy] = at(here);
      const near = players
        .filter((i) => i !== here && i !== before)
        .sort((a, b) => Math.hypot(at(a)[0] - hx, at(a)[1] - hy) - Math.hypot(at(b)[0] - hx, at(b)[1] - hy));
      const free = near.filter((i) => !taken.includes(i));
      const pick = (free.length ? free : near).slice(0, NEARBY);
      return pick[Math.floor(Math.random() * pick.length)];
    };
    const route = [players[Math.floor(Math.random() * players.length)]];
    while (route.length <= PASSES) route.push(next(route[route.length - 1], route[route.length - 2], []));
    // The decoy routes start where the real brick is at the split and then go their own way, never
    // landing on the same hands as the real one or each other.
    const splitAt = Math.max(1, PASSES - DECOY_PASSES);
    const decoys = Array.from({ length: DECOYS }, () => [route[splitAt]]);
    for (let r = splitAt + 1; r <= PASSES; r++) {
      const taken = [route[r]];
      for (const d of decoys) {
        const stop = next(d[d.length - 1], d[d.length - 2], taken);
        d.push(stop);
        taken.push(stop);
      }
    }
    if (players.length < DECOYS + 2) decoys.length = 0;

    setPhase("shuffling");
    setHearts(HEARTS);
    setOpened(null);
    setConfetti(null);
    setFlashed(null);
    setJiggling(false);
    setDecoysAt([]);
    setHolder(route[route.length - 1]);
    // First the brick, big, in the middle of the screen.
    setBrickAt(INTRO);
    setBrickShown(true);
    setPass({ step: 0, ms: FLY_IN_MS });
    sfx.start();
    later(250, sfx.pop);
    // Then it flies (shrinking) into the first pair of hands...
    later(INTRO_MS, () => {
      setBrickAt(route[0]);
      setPass({ step: 1, ms: FLY_IN_MS });
      sfx.whoosh(0.8);
    });
    // ...and is passed along, faster and faster, a whoosh each time, a little higher each time.
    let when = INTRO_MS + FLY_IN_MS + 150;
    let ms = FIRST_PASS_MS;
    route.slice(1).forEach((i, step) => {
      const thisMs = ms;
      const r = step + 1;
      if (r === splitAt && decoys.length) {
        // The split: copies pop out of the same hands just before they all fly off.
        later(when + thisMs, () => {
          setDecoysAt(decoys.map((d) => d[0]));
          sfx.pop();
          flash("it split!", "info");
        });
      }
      later(when, () => {
        setBrickAt(i);
        if (r > splitAt && decoys.length) setDecoysAt(decoys.map((d) => d[r - splitAt]));
        setPass({ step: step + 2, ms: thisMs });
        sfx.whoosh(1 + step * 0.06);
      });
      when += thisMs + PASS_GAP_MS;
      ms = Math.max(FASTEST_PASS_MS, ms * PASS_SPEED_UP);
    });
    // Then it is gone the instant it lands in the last pair of hands, everyone shuffles their fists,
    // and the player takes over.
    const landed = when - PASS_GAP_MS;
    later(landed, () => {
      setBrickShown(false);
      setJiggling(true);
      sfx.clack();
      sfx.rattle();
    });
    later(landed + SHUFFLE_MS, () => {
      setJiggling(false);
      setDecoysAt([]);
      setPhase("guessing");
    });
  }

  // Anyone with hands can be picked - even someone at the bottom edge who never got the brick; their
  // hands just open empty, the same as any other wrong guess.
  function guess(i: number) {
    if (phase !== "guessing" || opened !== null || !HEAD_FIT[headSlug(figures[i].person) ?? ""]) return;
    setOpened(i);
    sfx.open();
    if (i === holder) {
      setBrickAt(i);
      setBrickShown(true);
      setPhase("won");
      setFlashed(null);
      later(120, sfx.win);
      const at = handsAt(i, "open", box.width, box.height);
      if (at && !calm()) setConfetti({ ...at, key: newKey() });
      return;
    }
    const left = hearts - 1;
    setHearts(left);
    later(120, sfx.wrong);
    flash(left > 0 ? "nope!" : "no hearts left", "bad");
    if (!calm()) {
      setShaking(true);
      later(450, () => setShaking(false));
    }
    later(OPEN_MS, () => {
      if (left > 0) {
        setOpened(null);
      } else {
        // Out of hearts: the one who had it shows it.
        setOpened(holder);
        setBrickAt(holder);
        setBrickShown(true);
        setPhase("lost");
        setFlashed(null);
        sfx.lose();
        later(700, sfx.laugh);
      }
    });
  }

  // A tiny tick when hovering over someone while guessing (not more than every 60ms).
  function hover() {
    if (phase !== "guessing" || opened !== null) return;
    const now = performance.now();
    if (now - lastTick.current > 60) sfx.tick();
    lastTick.current = now;
  }

  function stop() {
    clearTimers();
    setJiggling(false);
    setDecoysAt([]);
    setPhase("idle");
    setBrickAt(null);
    setOpened(null);
    setFlashed(null);
    setConfetti(null);
  }

  const playing = phase !== "idle";
  // During the game everyone holds their hands closed in front of them; the one picked opens up.
  const poseFor = (i: number): GamePose | null => (playing ? (opened === i ? "open" : "hold") : null);

  // Where the brick is drawn: big in the middle for the intro, otherwise at the hands of whoever
  // holds it (between fists, or in front of open palms).
  let brick: { x: number; y: number; size: number } | null = null;
  if (playing && brickAt === INTRO) {
    // Just above the game message, which takes the title spot in the middle of the screen.
    brick = { x: box.width / 2, y: box.height / 2 - Math.min(150, box.height * 0.17), size: Math.min(140, box.width * 0.3) };
  } else if (playing && brickAt !== null) {
    const at = handsAt(brickAt, poseFor(brickAt) ?? "hold", box.width, box.height);
    if (at) brick = { ...at, size: figures[brickAt].size * 0.17 };
  }
  // The decoys, drawn exactly like the real one.
  const decoyBricks = playing
    ? decoysAt.flatMap((d) => {
        const at = handsAt(d, "hold", box.width, box.height);
        return at ? [{ ...at, size: figures[d].size * 0.17 }] : [];
      })
    : [];

  const answer = figures[holder]?.person.name;
  // The main message for each stage of the game (a quick flash like nope! shows over it for a moment),
  // and the one-line instruction under the hearts.
  const message: Flash = flashed ?? {
    shuffling: { text: "watch the brick!", tone: "info" as Tone, key: -1 },
    guessing: { text: "who has it?", tone: "info" as Tone, key: -2 },
    won: { text: "found it!", tone: "good" as Tone, key: -3 },
    lost: { text: "game over", tone: "bad" as Tone, key: -4 },
    idle: { text: "", tone: "info" as Tone, key: -5 },
  }[phase];
  const hint =
    phase === "shuffling"
      ? decoysAt.length
        ? "only one is real - follow it"
        : "keep your eyes on the yellow brick"
      : phase === "guessing"
        ? "tap whoever is hiding it"
        : `it was ${answer}`;

  return {
    phase,
    playing,
    shaking,
    jiggling,
    poseFor,
    guess,
    hover,
    canGuess: phase === "guessing" && opened === null,
    // Whoever had it, laughing at the player who could not find it.
    laughing: phase === "lost" ? holder : null,
    // Everything the game adds on top of the crowd: the brick, confetti, and the game HUD.
    overlay: (
      <>
        {/* The decoys first, so they never draw over the real one in a way that gives it away. */}
        {[...decoyBricks, ...(brick ? [brick] : [])].map((b, n) => (
          <div
            key={n}
            aria-hidden="true"
            className="pointer-events-none absolute z-[85] -translate-x-1/2 -translate-y-1/2"
            style={{
              left: b.x,
              top: b.y,
              width: b.size,
              transition: `left ${pass.ms}ms ease-in-out, top ${pass.ms}ms ease-in-out, width ${pass.ms}ms ease-in-out, opacity ${brickShown ? 250 : 90}ms, scale ${brickShown ? 250 : 90}ms`,
              opacity: brickShown ? 1 : 0,
              scale: brickShown ? "1" : "0.3",
            }}
          >
            {/* The intro brick spins in; after that, a fresh hop (up and down) for every pass. */}
            <div
              key={pass.step}
              className={pass.step === 0 ? "animate-brick-intro" : "animate-[brick-hop_var(--hop)_ease-in-out]"}
              style={{ ["--hop" as string]: `${pass.ms}ms` }}
            >
              <Brick />
            </div>
          </div>
        ))}
        {confetti && <Confetti key={confetti.key} x={confetti.x} y={confetti.y} />}
        {phase === "lost" && figures[holder] && (
          <Laugh
            x={(figures[holder].left / 100) * box.width}
            y={(figures[holder].top / 100) * box.height}
            size={figures[holder].size}
          />
        )}
        {playing && (
          <button
            type="button"
            aria-label={muted ? "Sound on" : "Sound off"}
            onClick={() => {
              setMuted(!muted);
              setMutedState(!muted);
            }}
            className="absolute top-3 left-3 z-[95] flex size-10 cursor-pointer items-center justify-center bg-black text-white shadow-md md:top-8 md:left-8 md:size-12"
          >
            <SpeakerIcon muted={muted} />
          </button>
        )}
        {phase === "idle" && (
          <div className="absolute bottom-5 left-1/2 z-[95] -translate-x-1/2 md:bottom-8">
            <GameButton onClick={start} big>
              <span className="w-8 md:w-10">
                <Brick />
              </span>
              play
              <span className="font-nanum-pen text-[18px] md:text-[22px]">find the brick</span>
            </GameButton>
          </div>
        )}
        {playing && (
          <GameScreen
            message={message}
            hearts={hearts}
            hint={hint}
            finished={phase === "won" || phase === "lost"}
            onAgain={start}
            onDone={stop}
          />
        )}
      </>
    ),
  };
}

// A 2x1 lego brick, side on: the body and two studs. Fills the width it is given.
function Brick() {
  return (
    <svg viewBox="-1 -1 18 14" className="block w-full drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
      <g fill={BRICK} stroke={BRICK_EDGE} strokeWidth={1} strokeLinejoin="round">
        <rect x="2.5" y="0" width="4" height="3.5" />
        <rect x="9.5" y="0" width="4" height="3.5" />
        <rect x="0" y="3" width="16" height="9" />
      </g>
    </svg>
  );
}

// A chunky black sticker button, like the site menu button.
function GameButton({ children, onClick, big, quiet }: { children: React.ReactNode; onClick: () => void; big?: boolean; quiet?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-drowner animate-sticker-pop flex cursor-pointer items-center gap-3 whitespace-nowrap shadow-md transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.04] active:translate-y-0.5 active:scale-[0.97] ${
        quiet ? "bg-white text-[#0e0e0d] ring-2 ring-[#0e0e0d]" : "bg-[#0e0e0d] text-white"
      } ${big ? "px-5 py-3 text-[26px] md:px-7 md:py-4 md:text-[34px]" : "px-4 py-2 text-[20px] md:px-5 md:py-3 md:text-[26px]"}`}
    >
      {children}
    </button>
  );
}

// The game screen, in the title spot in the middle (the title steps aside while a game is on): the
// big message, the hearts, a one-line instruction, and at the end the play again / done buttons.
function GameScreen({
  message,
  hearts,
  hint,
  finished,
  onAgain,
  onDone,
}: {
  message: Flash;
  hearts: number;
  hint: string;
  finished: boolean;
  onAgain: () => void;
  onDone: () => void;
}) {
  const colour = message.tone === "bad" ? "#E82803" : message.tone === "good" ? "#14B73E" : "#0e0e0d";
  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-x-0 top-1/2 z-[90] flex -translate-y-1/2 flex-col items-center px-4 text-center"
    >
      {/* Lives on top, like any game HUD. */}
      <Hearts hearts={hearts} />
      {/* A new message pops in each time it changes; a white outline keeps it clear of any figure
          it overlaps. */}
      <span
        key={message.key}
        className="font-drowner animate-sticker-pop mt-3 leading-[0.9] md:mt-4"
        style={{ fontSize: "clamp(46px, 8.5vw, 128px)", color: colour, WebkitTextStroke: "7px #fff", paintOrder: "stroke fill" }}
      >
        {message.text}
      </span>
      {/* The instruction: the same handwritten green as the site sublines. */}
      <span
        className="font-nanum-pen mt-2 text-[22px] leading-tight text-[#244638] md:mt-3 md:text-[30px]"
        style={{ WebkitTextStroke: "4px #fff", paintOrder: "stroke fill" }}
      >
        {hint}
      </span>
      {finished && (
        <div className="pointer-events-auto mt-5 flex gap-3 md:mt-6">
          <GameButton onClick={onAgain}>play again</GameButton>
          <GameButton onClick={onDone} quiet>
            done
          </GameButton>
        </div>
      )}
    </div>
  );
}

// The three hearts. The one just lost jumps, spins and falls away (heart-lose); the slot it leaves
// behind is an empty outline.
function Hearts({ hearts }: { hearts: number }) {
  return (
    <div className="flex gap-1.5 md:gap-2" aria-label={`${hearts} of ${HEARTS} hearts left`}>
      {Array.from({ length: HEARTS }, (_, i) => (
        <span key={i} className="relative block size-7 md:size-9">
          <PixelHeart full={false} />
          {i < hearts && (
            <span className="absolute inset-0">
              <PixelHeart full />
            </span>
          )}
          {i === hearts && (
            <span key={hearts} className="animate-heart-lose absolute inset-0">
              <PixelHeart full />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

// A pixel heart in the site magenta, outlined; empty is just the outline.
function PixelHeart({ full }: { full: boolean }) {
  const rows = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
  return (
    <svg viewBox="-0.6 -0.6 8.2 7.2" className="block size-full" shapeRendering="crispEdges">
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "X" ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={full ? "#EA34DF" : "#ffffff"} stroke="#0e0e0d" strokeWidth={0.18} />
          ) : null,
        ),
      )}
    </svg>
  );
}

// A burst of little lego-coloured squares from the hands that held the brick.
function Confetti({ x, y }: { x: number; y: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 60 + Math.random() * 90;
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 40,
        rot: Math.random() * 720 - 360,
        size: 6 + Math.random() * 6,
        colour: CONFETTI[i % CONFETTI.length],
      };
    }),
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute z-[88]" style={{ left: x, top: y }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="animate-confetti absolute block"
          style={{
            width: p.size,
            height: p.size,
            background: p.colour,
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
            ["--rot" as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}

// Laughing so hard it cries: tears squirting out of both sides of the head in arcs, over and over,
// and a ha ha! popping up above it. Placed on the centre of the head of whoever had the brick.
function Laugh({ x, y, size }: { x: number; y: number; size: number }) {
  const drop = Math.max(10, size * 0.13);
  const tears = [-1, 1].flatMap((side) =>
    Array.from({ length: 4 }, (_, n) => ({
      side,
      n,
      dx: side * size * (0.45 + n * 0.08),
      delay: n * 160 + (side > 0 ? 80 : 0),
    })),
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute z-[86]" style={{ left: x, top: y }}>
      {tears.map((t) => (
        <span
          key={`${t.side}-${t.n}`}
          className="animate-tear absolute block"
          style={{
            left: t.side * size * 0.26,
            top: -size * 0.02,
            width: drop,
            height: drop * 1.35,
            background: "#06C3FB",
            border: "2px solid #fff",
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            animationDelay: `${t.delay}ms`,
            ["--dx" as string]: `${t.dx}px`,
            ["--dy" as string]: `${size * 0.55}px`,
          }}
        />
      ))}
      <span
        className="font-drowner animate-ha absolute left-1/2 whitespace-nowrap leading-none text-[#0e0e0d]"
        style={{ top: -size * 0.95, fontSize: Math.max(24, size * 0.36), WebkitTextStroke: "5px #fff", paintOrder: "stroke fill" }}
      >
        ha ha!
      </span>
    </div>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="square" className="size-5 md:size-6" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10" />}
    </svg>
  );
}
