"use client";

import { useEffect, useRef, useState } from "react";
import TimerBoard from "./timer-board";
import TimerToast, { useTimerMilestones } from "./timer-toast";
import { clearTimer, loadTimer, saveTimer, type StoredTimer } from "./storage";

function pad(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
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
          <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
            {!ended && (
              <p
                className="font-nanum-pen text-[#0e0e0d]"
                style={{ fontSize: "clamp(18px, 3vw, 24px)", textShadow: "0 0 6px rgba(255,255,255,0.6)" }}
              >
                building ends in
              </p>
            )}
            <p
              className="font-drowner leading-none text-[#0e0e0d]"
              style={{
                fontSize: "clamp(56px, 13vw, 140px)",
                letterSpacing: "0.02em",
                textShadow: "0 0 8px rgba(255,255,255,0.6)",
              }}
            >
              {ended ? "time's up!" : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
            </p>
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
