"use client";

import { useEffect, useRef, useState } from "react";
import AnimatedElephant from "./animated-elephant";
import CuriosityReveal from "./curiosity-reveal";
import { HoverDot } from "./hover-dot";

// The same fire-breathing creature (and frames) the hero's tetris field perches on the skyline
// (see ELE3_FRAMES in tetris-field.tsx) - reused here at rest beside the reveal button instead of
// standing on blocks. Its burst is mirrored onto the button's heat via onBurstChange below, so
// the button visibly heats up with the fire and cools back down between bursts.
const ELE3_FRAMES = ["/ele3a.webp", "/ele3b.webp", "/ele3c.webp", "/ele3d.webp"];

// Real blackbody heating stages (cold iron -> dark red -> cherry red -> orange -> yellow-hot),
// not a flat on/off color - each stop is [heat 0..1, [r,g,b]], interpolated between neighbours.
const IRON_STOPS: [number, [number, number, number]][] = [
  [0, [23, 21, 20]],
  [0.35, [110, 24, 10]],
  [0.6, [200, 68, 14]],
  [0.8, [255, 128, 18]],
  [1, [255, 191, 64]],
];
// AnimatedElephant's burst below is 3 fire frames + a return-to-idle frame, held FRAME_MS each,
// plus one more FRAME_MS gap before it reports the burst done (see play() in animated-elephant.tsx)
// - i.e. (3 + 1 + 1) * FRAME_MS. Matching IGNITE_MS to that exactly keeps the two in lockstep: the
// button starts heating the instant the fire starts and hits full heat right as the dragon's mouth
// closes, instead of drifting out of sync with however long the burst happens to run.
const FRAME_MS = 550;
const IGNITE_MS = FRAME_MS * 5;
const COOL_MS = 4400;

function ironColor(heat: number) {
  const t = Math.min(1, Math.max(0, heat));
  for (let i = 0; i < IRON_STOPS.length - 1; i++) {
    const [t0, c0] = IRON_STOPS[i];
    const [t1, c1] = IRON_STOPS[i + 1];
    if (t <= t1) {
      const localT = (t - t0) / (t1 - t0);
      return c0.map((c, i2) => Math.round(c + (c1[i2] - c) * localT)) as [number, number, number];
    }
  }
  return IRON_STOPS[IRON_STOPS.length - 1][1];
}

const REF_WIDTH = 1280;
const REF_HEIGHT = 832;

// The Figma file has no mobile frame for this section, so it is rebuilt for the 402px artboard the
// other mobile frames use rather than inferred: same elements in the same arrangement (dot
// top-right, countdown centred), sized for a phone.
const MOBILE_WIDTH = 402;
const MOBILE_HEIGHT = 470;
// "999 hour" measures 361px at 100px Drowner, so the widest the countdown can ever get still
// clears the frame at this size - and it matches the mobile hero's own 95px display type.
const MOBILE_COUNTDOWN_SIZE = 90;
// The same 0.04em the desktop countdown uses (4.7265 / 118.163).
const MOBILE_COUNTDOWN_TRACKING = MOBILE_COUNTDOWN_SIZE * 0.04;
const MOBILE_DOT_SIZE = 34.52;
// Actual rendered height of one line vs. the two-line ("X hour" / "Y min") stack, at the
// countdown's line-height - everything on this canvas is absolutely positioned with a fixed
// top, not laid out in flow, so the button below has to pick its own top based on which of these
// the text is actually showing rather than assuming a box height will push it down.
const MOBILE_COUNTDOWN_LINE_HEIGHT = MOBILE_COUNTDOWN_SIZE * 1.05;

const DOT_ASSETS = ["/why-dot.svg", "/hero-dot-1.svg", "/hero-dot-2.svg", "/hero-dot-3.svg", "/hero-dot-4.svg"] as const;

// Event kicks off 5 PM IST (UTC+5:30) on Sep 3 - the explicit offset pins the instant regardless
// of the visitor's own timezone, so the countdown is always correct against real IST.
const EVENT_START = new Date("2026-09-03T17:00:00+05:30").getTime();
const UPDATE_INTERVAL_MS = 30_000;

function remainingUntilEvent() {
  const diffMs = Math.max(0, EVENT_START - Date.now());
  const totalMinutes = Math.floor(diffMs / 60_000);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

function isEventLive() {
  return Date.now() >= EVENT_START;
}

// Same target cell sizes the hero's own fields use, so the reveal's blocks come out the size
// visitors have already seen on the way down (see page.tsx and mobile-hero.tsx).
const DESKTOP_TARGET_CELL = 68;
const MOBILE_TARGET_CELL = 22;

// The reveal runs itself: the board fills, the dates land on it once those blocks have settled
// (animate-lego-pop is 200ms), they hold for a beat, the venue roster takes their place for a
// longer beat (enough time to actually hover a few tiles), and then the section comes back.
const CARDS_IN_MS = 320;
const DATES_HOLD_MS = 3000;
const VENUES_HOLD_MS = 4500;

// The button sits inside each breakpoint's own scaled canvas (mobile and desktop render both,
// toggling visibility with CSS rather than mounting/unmounting - see TimerSection below), so each
// needs its own dragon and its own isFiring/heat state. Sharing one state across both closures'
// AnimatedElephant instances (as a plain top-taking function did before) let the CSS-hidden
// breakpoint's independent, randomly-timed dragon flip the *visible* button's color out of sync
// with the dragon actually on screen - hence a real component here, not a helper function.
function CuriosityButton({
  top,
  revealed,
  onReveal,
  label,
  centerOffset = 0,
}: {
  top: number;
  revealed: boolean;
  onReveal: () => void;
  label: string;
  // The elephant perches outside the button's own 180px box (positioned via the child's `right`
  // offset below, not by taking up space in it), so centering just the box leaves the actual
  // elephant+button cluster looking shifted left - most visible on the mobile canvas, where the
  // ~27px of elephant hanging off the left edge is a much bigger fraction of the screen than on
  // desktop. This nudges the box right by that same amount so the whole cluster reads as centered.
  centerOffset?: number;
}) {
  const [isFiring, setIsFiring] = useState(false);
  // 0 = cold iron, 1 = fully hot. Driven by a rAF ramp below rather than snapping straight to a
  // fixed color, so the button visibly climbs through the same stages the dragon's fire would
  // actually heat metal through, and eases back down just as gradually.
  const [heat, setHeat] = useState(0);
  const heatRef = useRef(0);

  useEffect(() => {
    const target = isFiring ? 1 : 0;
    const duration = isFiring ? IGNITE_MS : COOL_MS;
    const start = heatRef.current;
    const startTime = performance.now();
    let frame: number;

    const step = (now: number) => {
      const rawT = Math.min(1, (now - startTime) / duration);
      // Igniting eases in (slow to catch, like the button itself needs a moment to start
      // absorbing the breath); cooling eases out with a cubic tail (fast to stop climbing, then a
      // long, slow fade back to cold) rather than the gentler quadratic ease, which read as done
      // too soon for something meant to be radiating heat away.
      const eased = isFiring ? rawT * rawT : 1 - Math.pow(1 - rawT, 3);
      const value = start + (target - start) * eased;
      heatRef.current = value;
      setHeat(value);
      if (rawT < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isFiring]);

  return (
    <div
      className={`absolute -translate-x-1/2 transition-opacity duration-200 ${
        revealed ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ top: `${top}px`, left: `calc(50% + ${centerOffset}px)`, width: "180px", height: "48px" }}
    >
      {/* Perches just left of the button, breathing fire at its own idle/burst rhythm - the
          button's color is driven off the same burst via onBurstChange rather than re-timed
          separately, so the two always heat up and cool down together. */}
      <AnimatedElephant
        frames={ELE3_FRAMES}
        anchor="left"
        frameIntervalMs={FRAME_MS}
        repeatCount={1}
        onBurstChange={setIsFiring}
        style={{ right: "calc(100% + 54px)", bottom: 0, height: "48px" }}
      />
      <button
        type="button"
        onClick={onReveal}
        className="font-nanum-pen relative flex size-full cursor-pointer items-center justify-center shadow-md transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.04] active:translate-y-0.5 active:scale-[0.97] select-none"
        style={{
          fontSize: "24px",
          // A continuous 3-stop blend rather than two matching stops butted against a third - that
          // earlier version held one flat color out to a point and then cut hard to the next,
          // which read as a vertical bar wiping across rather than the button itself heating up.
          // This keeps the same idea (hottest where the dragon's breath lands, on the left) but as
          // one smooth gradient the whole button visibly glows through, not a moving edge.
          background: `linear-gradient(to right, rgb(${ironColor(heat).join(",")}) 0%, rgb(${ironColor(heat * 0.85).join(",")}) 55%, rgb(${ironColor(heat * 0.65).join(",")}) 100%)`,
          color: heat > 0.55 ? "#241100" : "#ffffff",
        }}
      >
        {label}
      </button>
    </div>
  );
}

export default function TimerSection() {
  // Left null through the initial (server-matching) render so hydration never has to reconcile
  // a server-computed countdown against a client one computed moments later.
  const [remaining, setRemaining] = useState<{ hours: number; minutes: number } | null>(null);
  const [live, setLive] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [stage, setStage] = useState<"dates" | "venues" | null>(null);

  useEffect(() => {
    if (!revealed) return;
    // Once the event is live, "know where?" has nothing to say about dates anymore - jump
    // straight to the venue roster instead of running it through the dates stage first.
    if (live) {
      const toVenues = setTimeout(() => setStage("venues"), CARDS_IN_MS);
      const toClose = setTimeout(() => {
        setRevealed(false);
        setStage(null);
      }, CARDS_IN_MS + VENUES_HOLD_MS);
      return () => {
        clearTimeout(toVenues);
        clearTimeout(toClose);
      };
    }
    const toDates = setTimeout(() => setStage("dates"), CARDS_IN_MS);
    const toVenues = setTimeout(() => setStage("venues"), CARDS_IN_MS + DATES_HOLD_MS);
    const toClose = setTimeout(() => {
      setRevealed(false);
      setStage(null);
    }, CARDS_IN_MS + DATES_HOLD_MS + VENUES_HOLD_MS);
    return () => {
      clearTimeout(toDates);
      clearTimeout(toVenues);
      clearTimeout(toClose);
    };
  }, [revealed, live]);

  useEffect(() => {
    setRemaining(remainingUntilEvent());
    setLive(isEventLive());
    const id = setInterval(() => {
      setRemaining(remainingUntilEvent());
      setLive(isEventLive());
    }, UPDATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="timer-section" className="relative flex h-screen w-full snap-start snap-always items-center justify-center overflow-hidden bg-white">
      <div
        className="relative shrink-0 lg:hidden"
        style={{
          width: `${MOBILE_WIDTH}px`,
          height: `${MOBILE_HEIGHT}px`,
          transform: `scale(min(1, calc(100vw / ${MOBILE_WIDTH}px), calc(100vh / ${MOBILE_HEIGHT}px)))`,
          transformOrigin: "center center",
        }}
      >
        <div className="animate-timer-dot-pulse absolute" style={{ left: "337px", top: "44px" }}>
          <HoverDot assets={DOT_ASSETS} baseIndex={0} size={MOBILE_DOT_SIZE} />
        </div>

        {/* Subheading in cursive font (font-nanum-pen) - Centered */}
        <p
          className="font-nanum-pen absolute left-1/2 -translate-x-1/2 text-center text-[#100f0f]"
          style={{
            top: "70px",
            width: `${MOBILE_WIDTH}px`,
            fontSize: "28px",
            lineHeight: "32px",
          }}
        >
          {live ? "happening across 8 venues today" : "making starts in"}
        </p>

        {/* Hours stacked over minutes, or (once live) "it's live" - same primary font and size
            either way, just swapping what fills the slot. */}
        <p
          className="font-drowner absolute left-1/2 -translate-x-1/2 text-center text-black"
          style={{
            top: "115px",
            width: `${MOBILE_WIDTH}px`,
            fontSize: `${MOBILE_COUNTDOWN_SIZE}px`,
            lineHeight: 1.05,
            letterSpacing: `${MOBILE_COUNTDOWN_TRACKING}px`,
          }}
        >
          {live ? (
            "it's live"
          ) : remaining ? (
            <>
              {remaining.hours} hour
              <br />
              {remaining.minutes} min
            </>
          ) : (
            " "
          )}
        </p>

        <CuriosityButton
          // 115 (countdown top) + however many lines it's actually showing right now + 32px
          // breathing room - stays close under the text whether that's one line ("it's live")
          // or the two-line hour/min stack, instead of always leaving room for both.
          top={115 + MOBILE_COUNTDOWN_LINE_HEIGHT * (live ? 1 : 2) + 32}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          label={live ? "know where?" : "know when?"}
        />
      </div>

      <div
        className="relative hidden shrink-0 lg:block"
        style={{
          width: `${REF_WIDTH}px`,
          height: `${REF_HEIGHT}px`,
          transform: `scale(min(1, calc(100vw / ${REF_WIDTH}px), calc(100vh / ${REF_HEIGHT}px)))`,
          transformOrigin: "center center",
        }}
      >
        <div className="animate-timer-dot-pulse absolute" style={{ left: "1120px", top: "89px" }}>
          <HoverDot assets={DOT_ASSETS} baseIndex={0} size={63.73} />
        </div>

        {/* Desktop subheading in cursive font (font-nanum-pen) - Centered */}
        <p
          className="font-nanum-pen absolute left-1/2 -translate-x-1/2 text-center text-[#100f0f]"
          style={{
            top: "245px",
            fontSize: "38px",
            lineHeight: "42px",
          }}
        >
          {live ? "happening across 8 venues today" : "making starts in"}
        </p>

        {/* Desktop timer digits, or (once live) "it's live" - same primary font and size either
            way, just swapping what fills the slot. */}
        <p
          className="font-drowner absolute left-1/2 -translate-x-1/2 text-center text-black"
          style={{
            top: "310px",
            width: `${REF_WIDTH}px`,
            height: "130px",
            fontSize: "118.163px",
            lineHeight: "normal",
            letterSpacing: "4.7265px",
          }}
        >
          {live ? "it's live" : remaining ? `${remaining.hours} hour ${remaining.minutes} min` : " "}
        </p>

        <CuriosityButton
          top={490}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          label={live ? "know where?" : "know when?"}
        />
      </div>

      {/* Outside both scaled canvases so the board fills the real section rather than the design's
          reference box - the same placement the hero gives its own field. */}
      {revealed && (
        <>
          {/* Mobile's cells are a third the size of desktop's, so its cards take a proportionally
              bigger footprint (still 2:3) to come out physically similar. */}
          {/* Above FloatingPet's z-50: the section is position:relative with z-index auto, so it
              doesn't box these in - they and the fixed pet both resolve against the root, and the
              board has to cover it rather than the pet sitting on top of the reveal. */}
          <div className="absolute inset-0 z-[60] lg:hidden">
            <CuriosityReveal
              targetCell={MOBILE_TARGET_CELL}
              cardCols={4}
              cardRows={6}
              venueCardCols={2}
              venueCardRows={2}
              stage={stage}
            />
          </div>
          <div className="absolute inset-0 z-[60] hidden lg:block">
            <CuriosityReveal
              targetCell={DESKTOP_TARGET_CELL}
              cardCols={2}
              cardRows={3}
              venueCardCols={1}
              venueCardRows={1}
              stage={stage}
            />
          </div>
        </>
      )}
    </section>
  );
}
