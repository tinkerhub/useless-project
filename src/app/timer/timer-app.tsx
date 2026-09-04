"use client";

import { useEffect, useRef, useState } from "react";
import TimerBoard from "./timer-board";
import TimerToast, { useTimerMilestones } from "./timer-toast";
import { clearTimer, loadTimer, saveTimer, type StoredTimer } from "./storage";
import { MorphingText } from "@/components/ui/liquid-text";

// While the countdown is running, the clock periodically liquid-morphs into the site's own name
// for a beat, then liquid-morphs back - a brand interlude, not a state change. A MorphingText
// cycles through whatever texts it's given forever, on a fixed (morphTime + cooldownTime) beat
// per pass (see liquid-text.tsx) - two passes here: clock -> phrase, then phrase -> clock again.
// That second pass's target is deliberately NOT the live clock read at the moment the pass
// *starts* - it's the clock value PREDICTED for the moment the pass *ends* (see `midTimeout`
// below, which subtracts the pass's own duration off the remaining seconds before formatting).
// Using the read-it-now value instead undercounts by exactly one pass length: by the time that
// value actually reaches the screen, the real countdown has moved on that much further, and
// handing off to the live, still-ticking clock underneath makes the counter visibly skip forward
// by that same amount. Predicting ahead is what makes the two actually line up.
const BRAND_INTERLUDE_INTERVAL_MS = 20_000;
// Must equal (morphTime + cooldownTime) * 1000 from liquid-text.tsx exactly - that's how long one
// pass actually takes there, and everything below (the predicted handoff time, the cooldown
// safety margin) is scheduled against that real duration. cooldownTime was bumped from 0.5s to 1s
// so the settled phrase actually holds for a beat instead of starting to morph away again almost
// immediately - update both together if either changes.
const MORPH_PASS_MS = 2500;
const BRAND_INTERLUDE_DURATION_MS = MORPH_PASS_MS * 2;
// liquid-text.tsx's cooldownTime (1s, in seconds there) is how long a MorphingText holds still on
// a settled text before it automatically starts morphing to the *next* entry in its array on its
// own - it has no concept of "stop after 2 passes", so once the second pass settles, it will
// start cycling back toward the array's first (stale) entry the instant that hold runs out,
// whether or not we've unmounted it yet. If our own cross-fade-out took longer than that hold,
// the overlay would still be partway through that unwanted third pass - visibly morphing toward
// stale, wrong text - while it faded, which is what read as the counter glitching/disappearing
// right after the interlude. So CROSSFADE_MS has to fit inside that hold with room to spare, not
// be tuned only for how smooth the fade itself looks.
const MORPH_COOLDOWN_MS = 1000;
const CROSSFADE_MS = 500;
// How much earlier than BRAND_INTERLUDE_DURATION_MS to actually unmount, on top of CROSSFADE_MS
// itself - CROSSFADE_MS (500ms) already leaves 500ms of MORPH_COOLDOWN_MS (1000ms) unused, and
// this reserves a slice of that as a buffer against setTimeout's own imprecision, rather than
// spending all of it on the fade and cutting the unmount exactly as close as the math allows.
const UNMOUNT_SAFETY_MARGIN_MS = 40;
// The clock and the brand phrase are two different elements (different font size, different
// widths) - swapping which one is rendered with no transition of its own reads as an instant
// "jump" rather than a transition. Both stay stacked in the same spot and cross-fade into and out
// of each other over this long as a finishing touch once the liquid morph itself has already
// carried the visual transition - a fully seamless handoff back to the live element rather than a
// last visible pop. Unmounting happens a little before the interlude's nominal end (see
// `unmountDelay` below), inside the safety margin MORPH_COOLDOWN_MS leaves - not exactly at the
// end - so it's reliably gone before that unwanted third pass could ever start.
// Both the clock and the brand phrase share this exact font size (and sit in the exact same
// spot, see the "stage" below) - the counter itself must never resize or shift, not even a
// little, while the effect plays. "useless projects" is far wider than eight digits at this
// size, so it wraps onto two lines instead of the font shrinking to fit on one.
const CLOCK_FONT_SIZE = "clamp(80px, 13vw, 200px)";
const LABEL_FONT_SIZE = "clamp(22px, 3vw, 24px)";
// An actual line break rather than a narrower max-width / tighter letter-spacing to force the
// wrap - those would apply just as much to the *digit* passes sharing this same MorphingText
// (see the "stage" below), rendering the predicted handoff time at a different width than the
// live clock's own 0.02em-tracked digits and reintroducing the exact size/position mismatch this
// was meant to avoid. A literal "\n" (with white-space: pre-line, see below) affects only this
// phrase, since a digit string never contains one.
const BRAND_PHRASE = "Useless\nProjects";

function pad(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function formatClock(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function splitDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
  };
}

// Custom picker rather than the browser's native date/time input: that popup is entirely the
// OS's own chrome (different on every platform, unstyleable). Date, hour, minute and AM/PM are
// all the same control - a scrolling reel, genuinely scroll-and-snap like a slot machine, not a
// stepper standing in for one.
function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

const REEL_ITEM_HEIGHT = 40;
const REEL_VISIBLE_ROWS = 5;
const REEL_HEIGHT = REEL_ITEM_HEIGHT * REEL_VISIBLE_ROWS;
const REEL_PAD = (REEL_HEIGHT - REEL_ITEM_HEIGHT) / 2;

/**
 * A real scrolling reel: drag/swipe/wheel it and it settles on whichever option lands under the
 * centre band. Clicking an option scrolls it to centre instead of jumping straight there, so the
 * motion always reads the same way regardless of how a value got picked.
 */
function Reel<T extends string | number>({
  options,
  value,
  onChange,
  format,
  width = 68,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const index = options.indexOf(value);

  // Only ever positions the reel once, on mount (to match the picker's default value) - after
  // that the user's own scrolling is the sole source of truth, so this never fights a gesture or
  // an in-flight snap by jumping the scroll position out from under it.
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = index * REEL_ITEM_HEIGHT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settle = (targetIndex: number) => {
    const el = ref.current;
    if (!el) return;
    const clamped = Math.min(options.length - 1, Math.max(0, targetIndex));
    el.scrollTo({ top: clamped * REEL_ITEM_HEIGHT, behavior: "smooth" });
    const next = options[clamped];
    if (next !== value) onChange(next);
  };

  return (
    <div className="relative" style={{ height: REEL_HEIGHT, width }}>
      <div
        className="pointer-events-none absolute inset-x-0 rounded-xl border-y border-black/10 bg-black/[0.03]"
        style={{ top: REEL_PAD, height: REEL_ITEM_HEIGHT }}
      />
      <div
        ref={ref}
        onScroll={() => {
          if (settleTimer.current) clearTimeout(settleTimer.current);
          // Debounced rather than acting on every scroll event: only once the reel has actually
          // stopped moving (no scroll events for a beat) does "wherever it's sitting" mean
          // anything - mid-motion it's just passing through.
          settleTimer.current = setTimeout(() => {
            const el = ref.current;
            if (el) settle(Math.round(el.scrollTop / REEL_ITEM_HEIGHT));
          }, 120);
        }}
        className="no-scrollbar h-full overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: REEL_PAD }} />
        {options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            onClick={() => settle(i)}
            className={`font-drowner flex w-full cursor-pointer items-center justify-center transition-colors ${
              opt === value ? "text-[#0e0e0d]" : "text-black/25"
            }`}
            style={{ height: REEL_ITEM_HEIGHT, scrollSnapAlign: "center" }}
          >
            {format ? format(opt) : opt}
          </button>
        ))}
        <div style={{ height: REEL_PAD }} />
      </div>
    </div>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ["AM", "PM"] as const;
const DATE_COUNT = 30;

function dateOptions() {
  const today = startOfDay(new Date()).getTime();
  return Array.from({ length: DATE_COUNT }, (_, i) => today + i * 86_400_000);
}

function formatDateOption(ms: number, todayMs: number) {
  const diffDays = Math.round((ms - todayMs) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tmrw";
  return new Date(ms).toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

/** hour is kept in 12-hour form (1-12) since that's how the reel displays it. */
function partsFromDate(date: Date) {
  const h24 = date.getHours();
  return {
    hour: ((h24 + 11) % 12) + 1,
    minute: date.getMinutes(),
    period: (h24 >= 12 ? "PM" : "AM") as "AM" | "PM",
  };
}

function composeEndAt(dayMs: number, hour: number, minute: number, period: "AM" | "PM") {
  const h24 = period === "PM" ? (hour % 12) + 12 : hour % 12;
  const d = new Date(dayMs);
  d.setHours(h24, minute, 0, 0);
  return d.getTime();
}

function SetupForm({ onStart }: { onStart: (endAt: number) => void }) {
  const [dates] = useState(dateOptions);
  // Both derived from the same instant, so a default that happens to roll past midnight (someone
  // opening this at 11:40pm) lands on "Tomorrow" with a matching time, not "Today" with a time
  // that's already in the past.
  const [defaults] = useState(() => {
    const defaultEnd = new Date(Date.now() + 60 * 60_000);
    return { dayMs: startOfDay(defaultEnd).getTime(), ...partsFromDate(defaultEnd) };
  });
  const [dayMs, setDayMs] = useState(defaults.dayMs);
  const [hour, setHour] = useState(defaults.hour);
  const [minute, setMinute] = useState(defaults.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(defaults.period);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center gap-6 px-6 text-center">
      <h1 className="font-drowner text-[#0e0e0d]" style={{ fontSize: "clamp(32px, 6vw, 48px)" }}>
        enter your end time of hackathon
      </h1>
      <p className="font-helvetica text-[15px] leading-[1.5] text-[#33322f]">
        Pick when you want to stop. The board fills in as the clock runs down.
      </p>

      <div className="flex items-center gap-1">
        <Reel options={dates} value={dayMs} onChange={setDayMs} format={(ms) => formatDateOption(ms, dates[0])} width={84} />
        <Reel options={HOURS} value={hour} onChange={setHour} format={pad} />
        <span className="font-drowner text-[22px] text-[#0e0e0d]">:</span>
        <Reel options={MINUTES} value={minute} onChange={setMinute} format={pad} />
        <Reel options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      {error && <p className="font-helvetica text-[13px] text-[#e82803]">{error}</p>}

      <button
        type="button"
        onClick={() => {
          const endAt = composeEndAt(dayMs, hour, minute, period);
          if (endAt <= Date.now()) {
            setError("Pick a time in the future.");
            return;
          }
          onStart(endAt);
        }}
        className="font-nanum-pen w-full cursor-pointer rounded-full bg-black py-3 text-[20px] text-white transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0.5"
      >
        start timer
      </button>
    </div>
  );
}

function MinimizedPill({
  hours,
  minutes,
  seconds,
  onExpand,
}: {
  hours: number;
  minutes: number;
  seconds: number;
  onExpand: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="font-drowner fixed right-5 bottom-5 z-50 flex cursor-pointer items-center gap-2 rounded-full bg-black px-5 py-3 text-[20px] text-white shadow-lg transition-transform duration-200 ease-out hover:-translate-y-0.5"
      style={{ letterSpacing: "0.02em" }}
      aria-label="Expand timer"
    >
      <span className="size-2.5 rounded-full bg-[#ea34df]" />
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </button>
  );
}

export default function TimerApp() {
  // null = no timer running (show setup). Starts null on both server and client - the server
  // never sees localStorage, so hydration would mismatch if the client's first render already
  // reflected a resumed timer - and the effect below reads storage a moment after mount instead.
  const [timer, setTimer] = useState<StoredTimer | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    setTimer(loadTimer());
  }, []);

  useEffect(() => {
    if (!timer) {
      setNow(null);
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const remainingMs = timer && now !== null ? Math.max(0, timer.endAt - now) : null;
  const totalMs = timer ? timer.endAt - timer.startAt : null;
  const progress = remainingMs !== null && totalMs ? 1 - remainingMs / totalMs : 0;
  const { hours, minutes, seconds, totalSeconds } = splitDuration(remainingMs ?? 0);
  const running = timer !== null && remainingMs !== null;
  const ended = running && remainingMs === 0;

  const milestoneMessage = useTimerMilestones(running ? totalSeconds : null, running);

  // Read by the interlude timer below without being a dependency of it - so the interval keeps
  // firing on a fixed cadence instead of restarting (and re-basing that cadence) every second
  // the displayed digits tick over.
  const timeStringRef = useRef("");
  timeStringRef.current = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  // The clock's own `endAt` timestamp, not the `totalSeconds` React state - that state only
  // updates once a second on its own separate interval, so it can already be up to a second
  // stale at any given instant. Predicting off the timestamp directly instead of off that state
  // is what actually keeps the predicted handoff value exact rather than occasionally a second
  // off (which is exactly the kind of mismatch that reads as a sudden change at handoff).
  const endAtRef = useRef(timer?.endAt ?? 0);
  endAtRef.current = timer?.endAt ?? 0;

  // Periodically, while actually counting down, morphs the live clock into "Useless Projects"
  // and back - a brief brand interlude rather than something that only shows up once the
  // countdown is already over. `brandTexts` is [clock at interlude start, the phrase, clock
  // again] - MorphingText runs it as two passes (start -> phrase, then phrase -> the third
  // entry), so the third entry is overwritten with a freshly re-read clock value (`midTimeout`,
  // below) right as that second pass begins, rather than reusing the first, by-then-stale one.
  //
  // `brandMounted` and `brandVisible` are deliberately two separate flags, not one: the brand
  // element needs to exist in the DOM slightly before (and after) it's actually faded in, so the
  // opacity transition below has something to animate to/from instead of the element just
  // appearing/disappearing already at its end state.
  const [brandMounted, setBrandMounted] = useState(false);
  const [brandVisible, setBrandVisible] = useState(false);
  const [brandTexts, setBrandTexts] = useState<[string, string, string]>(["", BRAND_PHRASE, ""]);
  useEffect(() => {
    if (!running || ended) {
      setBrandMounted(false);
      setBrandVisible(false);
      return;
    }
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const raf = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn));

    const intervalId = setInterval(() => {
      const startTime = timeStringRef.current;
      setBrandTexts([startTime, BRAND_PHRASE, startTime]);
      setBrandMounted(true);
      // A frame (well, two - see FallingBlock in timer-board.tsx for why one isn't enough) after
      // mounting at opacity 0, flip to opacity 100 so the transition actually has two distinct
      // states to interpolate between rather than both landing in the same paint.
      raf(() => setBrandVisible(true));
      timeouts.push(
        setTimeout(() => {
          // Not timeStringRef.current (the live clock right now) - by the time this second pass
          // finishes playing, MORPH_PASS_MS more will have ticked by, so the value that needs to
          // be on screen at that moment is the clock ahead by that much, not the clock as of now.
          // Computed straight off endAt/Date.now() rather than off the totalSeconds React state,
          // which is only ever as fresh as its own once-a-second interval.
          const predictedMs = Math.max(0, endAtRef.current - (Date.now() + MORPH_PASS_MS));
          setBrandTexts([startTime, BRAND_PHRASE, formatClock(Math.round(predictedMs / 1000))]);
        }, MORPH_PASS_MS),
      );
      // Unmount a little before BRAND_INTERLUDE_DURATION_MS (the moment the second pass's
      // cooldown hold naturally runs out and an unwanted third pass would start) rather than
      // exactly at it - see MORPH_COOLDOWN_MS above for why cutting it that close isn't safe.
      const unmountDelay = BRAND_INTERLUDE_DURATION_MS - UNMOUNT_SAFETY_MARGIN_MS;
      timeouts.push(
        setTimeout(() => {
          setBrandVisible(false);
        }, unmountDelay - CROSSFADE_MS),
      );
      timeouts.push(setTimeout(() => setBrandMounted(false), unmountDelay));
    }, BRAND_INTERLUDE_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      timeouts.forEach(clearTimeout);
    };
  }, [running, ended]);

  const startTimer = (endAt: number) => {
    const fresh = { startAt: Date.now(), endAt };
    saveTimer(fresh);
    setTimer(fresh);
    setMinimized(false);
  };

  const resetTimer = () => {
    clearTimer();
    setTimer(null);
    setMinimized(false);
  };

  if (!running) {
    return (
      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white">
        <SetupForm onStart={startTimer} />
      </section>
    );
  }

  // The board itself (and its drop queue) stays mounted and running the whole time the timer is
  // "running", minimized or not - minimizing only swaps which UI sits on top of it. Unmounting it
  // on minimize would stop the fill (and reset its drop queue on the way back), which isn't what
  // "minimize" should mean.
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white">
      {/* Keyed on the timer's own start instant so a fresh timer (see "start another") remounts
          a genuinely empty board, rather than reusing the previous one's internal fill state -
          without this, the board's own size/columns often wouldn't have changed between timers,
          so its "reset the fill" effect (keyed on that layout, not on which timer is running)
          would never fire and the new run would start already showing the old one's full board. */}
      <TimerBoard key={timer.startAt} progress={progress} remainingMs={remainingMs} />
      <TimerToast message={milestoneMessage} />

      {minimized ? (
        <MinimizedPill hours={hours} minutes={minutes} seconds={seconds} onExpand={() => setMinimized(false)} />
      ) : (
        <>
          {/* Reset and minimize (top-left) - the top-right corner is the site nav's, so nothing
              else can live there without colliding with it. Reset is the "I didn't mean to start
              this" escape hatch, available the moment the timer starts, not just once the
              countdown has already finished. */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={resetTimer}
              className="font-helvetica cursor-pointer rounded-full bg-black/80 px-4 py-2 text-[13px] text-white backdrop-blur transition-transform duration-200 ease-out hover:-translate-y-0.5 md:px-5 md:py-2.5 md:text-[15px]"
              aria-label="Reset timer"
            >
              reset
            </button>
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="font-helvetica cursor-pointer rounded-full bg-black/80 px-4 py-2 text-[13px] text-white backdrop-blur transition-transform duration-200 ease-out hover:-translate-y-0.5 md:px-5 md:py-2.5 md:text-[15px]"
              aria-label="Minimize timer"
            >
              minimize
            </button>
          </div>

          {/* Plain, fixed-color text - no card behind it, no color swap as blocks pass behind
              it (both tried and both read worse). Just a faint white halo so the digits stay
              readable once a block is directly behind them, without the text itself changing. */}
          <div className="relative z-10 flex flex-col items-center px-6 text-center">
            {/* A fixed-size stage the clock and the brand phrase cross-fade inside of, reserved
                tall enough for "useless projects" to wrap onto two lines at the counter's own
                full size - without a reservation like this, swapping which of the two is on
                screen (or the phrase wrapping to a second line) would shift this whole block, and
                the counter itself would appear to move or resize the instant the effect played,
                which is exactly what shouldn't happen: the counter's own position and font size
                stay fixed throughout, only the content cross-fades. Opacity is driven via inline
                style rather than opacity-0/opacity-100 classes - those utilities weren't making it
                into the compiled stylesheet here, so the toggle was silently a no-op.

                The label sits absolutely positioned on top of this stage (not laid out as a flex
                sibling above it, and not just anchored to its top edge either) - a sibling's own
                height (and any margin/flex-gap used to nudge it up or down) would shift how tall
                the whole flex column is, which in turn shifts where the *stage* (and so the
                counter) lands once the outer section centers that column - i.e. moving the label
                would silently move the counter off center too. Sitting on top of the stage via a
                plain `top` offset means it can be moved anywhere over the stage - including down,
                closer to the counter - by changing one number, with the stage still alone
                deciding the column's height so the counter stays centered regardless. */}
            <div className="relative flex w-full items-center justify-center" style={{ minHeight: `calc(${CLOCK_FONT_SIZE} * 2)` }}>
              {!ended && (
                <p
                  className="font-nanum-pen absolute text-nowrap text-[#0e0e0d] transition-opacity ease-out"
                  style={{
                    top: "12%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: LABEL_FONT_SIZE,
                    textShadow: "0 0 6px rgba(255,255,255,0.6)",
                    opacity: brandVisible ? 0 : 1,
                    transitionDuration: `${CROSSFADE_MS}ms`,
                  }}
                >
                  building ends in
                </p>
              )}
              <p
                className="font-drowner leading-none text-[#0e0e0d] transition-opacity ease-out"
                style={{
                  fontSize: CLOCK_FONT_SIZE,
                  letterSpacing: "0.02em",
                  textShadow: "0 0 8px rgba(255,255,255,0.6)",
                  opacity: brandVisible ? 0 : 1,
                  transitionDuration: `${CROSSFADE_MS}ms`,
                }}
              >
                {ended ? "time's up!" : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
              </p>
              {brandMounted && (
                <div
                  className="absolute inset-0 flex items-center justify-center transition-opacity ease-out"
                  style={{
                    opacity: brandVisible ? 1 : 0,
                    transitionDuration: `${CROSSFADE_MS}ms`,
                    // Arbitrary-value Tailwind classes (text-[clamp(...)], opacity-N) weren't
                    // making it into the compiled stylesheet in this environment - font-size set
                    // here instead and left to inherit down into MorphingText, the same fix
                    // applied to opacity above.
                    fontSize: CLOCK_FONT_SIZE,
                    // Matches the live digit <p> exactly (not left to inherit "normal" from
                    // further up) - this is shared by both the phrase and the predicted-time
                    // passes, and any difference here changes the *digit* passes' rendered width
                    // too, which is what was still causing a size/position mismatch at handoff.
                    letterSpacing: "0.02em",
                    textShadow: "0 0 8px rgba(255,255,255,0.6)",
                  }}
                >
                  <MorphingText
                    texts={brandTexts}
                    className="font-drowner h-full px-6 leading-none text-[#0e0e0d]"
                    // white-space: pre-line, not a narrower max-width or tighter letter-spacing -
                    // see the BRAND_PHRASE comment for why those aren't safe to use here (they'd
                    // apply to the digit passes too). The phrase's own embedded "\n" is what
                    // actually forces its two-line wrap; a digit string has no such character, so
                    // this is a no-op for those passes. lineHeight tighter than leading-none's 1
                    // pulls "Useless" and "Projects" closer together - harmless on the single-line
                    // digit passes too, since line-height only affects the line box, not the
                    // glyphs, and those stay centered in the stage regardless.
                    style={{ whiteSpace: "pre-line", lineHeight: 0.82 }}
                  />
                </div>
              )}
            </div>
            {ended && (
              <button
                type="button"
                onClick={resetTimer}
                className="font-nanum-pen mt-2 cursor-pointer rounded-full bg-black px-6 py-2.5 text-[18px] text-white transition-transform duration-200 ease-out hover:-translate-y-0.5"
              >
                start another
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
