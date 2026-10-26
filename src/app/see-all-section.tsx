"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const REF_WIDTH = 1280;
const REF_HEIGHT = 832;

const SEE_ALL_URL = "https://airtable.com/appxzLxyo4vKPYH6w/shrRl7a8SMrf10Qhp";

const BUTTON_WIDTH = 837;
const BUTTON_HEIGHT = 364;

// The button's top-left origin in the reference canvas.
const BUTTON_LEFT = 221;
const BUTTON_TOP = 234;

// Loosely how small a normal button on this site reads (see the "see project" button in
// AppamSection) - the oversized card shrinks toward this before it can be clicked.
const MIN_SCALE = 0.42;
const SHRINK_DURATION_S = 1.3;
const POP_DURATION_S = 0.25;

type Phase = "idle" | "shrinking" | "ready" | "popped";

// A "catch me if you can" button: hovering starts it shrinking, leaving before it settles snaps
// it straight back to full size, and only once it has shrunk all the way down - while still
// hovered - does it accept a click.
export default function SeeAllSection() {
  const [phase, setPhase] = useState<Phase>("idle");
  const shrinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shrinkTimer.current) clearTimeout(shrinkTimer.current);
      if (popTimer.current) clearTimeout(popTimer.current);
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (phase === "popped") return;
    setPhase("shrinking");
    shrinkTimer.current = setTimeout(() => setPhase("ready"), SHRINK_DURATION_S * 1000);
  }, [phase]);

  const handleMouseLeave = useCallback(() => {
    if (shrinkTimer.current) {
      clearTimeout(shrinkTimer.current);
      shrinkTimer.current = null;
    }
    if (phase !== "popped") setPhase("idle");
  }, [phase]);

  const handleClick = useCallback(() => {
    if (phase !== "ready") return;
    setPhase("popped");
    popTimer.current = setTimeout(() => setPhase("idle"), POP_DURATION_S * 1000);
    window.open(SEE_ALL_URL, "_blank", "noopener,noreferrer");
  }, [phase]);

  // Idle → full size. Shrinking → animates to MIN_SCALE via CSS transition.
  // Ready → settled at MIN_SCALE, click allowed. Popped → brief micro-pop down then back.
  const scale =
    phase === "idle" ? 1 : phase === "popped" ? MIN_SCALE * 0.88 : MIN_SCALE;

  // ---------------------------------------------------------------------------
  // The core bug fix: CSS `transform: scale()` does NOT update the element's
  // DOM hit-box - pointer events still fire over the original pre-transform
  // area. This causes jitter when the mouse is on the "phantom" edge between
  // the visual button and its real (unchanged) layout box.
  //
  // Solution: split into two layers:
  //   1. Visual layer  – renders the styled button with `transform: scale()`,
  //      `pointer-events: none` so it never intercepts events.
  //   2. Hit-area overlay – a transparent `<button>` whose *actual* width/height
  //      and left/top properties transition in sync with the visual layer, so
  //      its DOM hit-box is always pixel-aligned with what the user sees.
  //
  // Hover is tracked on a fixed, full-size zone around that overlay, not on the
  // overlay itself. Otherwise a cursor resting near the edge loops forever: the
  // button shrinks out from under it (leave → snap back to full size), which
  // puts it under the cursor again (enter → shrink), and so on. The shrinking
  // overlay only takes the click.
  // ---------------------------------------------------------------------------

  const easingShrink = `cubic-bezier(0.4, 0, 0.2, 1)`;
  const easingPop = `cubic-bezier(0.34, 1.56, 0.64, 1)`;

  const visualTransition =
    phase === "idle"
      ? `transform 0.15s ${easingShrink}, background-color 0.15s ease`
      : phase === "shrinking"
        ? `transform ${SHRINK_DURATION_S}s ${easingShrink}, background-color 0.15s ease`
        : `transform ${POP_DURATION_S}s ${easingPop}, background-color 0.15s ease`;

  // Hit overlay transitions width/height/left/top so the event area moves with the visual.
  const hitTransitionProps = (dur: string, ease: string) =>
    `width ${dur} ${ease}, height ${dur} ${ease}, left ${dur} ${ease}, top ${dur} ${ease}`;

  const hitTransition =
    phase === "idle"
      ? hitTransitionProps("0.15s", easingShrink)
      : phase === "shrinking"
        ? hitTransitionProps(`${SHRINK_DURATION_S}s`, easingShrink)
        : hitTransitionProps(`${POP_DURATION_S}s`, easingPop);

  // Visual center of the button (fixed in canvas coords regardless of scale).
  const cx = BUTTON_LEFT + BUTTON_WIDTH / 2;
  const cy = BUTTON_TOP + BUTTON_HEIGHT / 2;

  // Hit-overlay actual bounds in canvas coords (matches visual at every point in the animation).
  const hitW = BUTTON_WIDTH * scale;
  const hitH = BUTTON_HEIGHT * scale;
  // Relative to the fixed hover zone, which covers the full-size button.
  const hitLeft = (BUTTON_WIDTH - hitW) / 2;
  const hitTop = (BUTTON_HEIGHT - hitH) / 2;

  const bgColor =
    phase === "ready"
      ? "#c8c8c8"
      : phase === "popped"
        ? "#bdbdbd"
        : "#d9d9d9";

  return (
    <section id="see-all-section" className="relative flex min-h-screen w-full snap-start snap-always items-center justify-center overflow-hidden bg-white">
      <div
        className="relative shrink-0"
        style={{
          width: `${REF_WIDTH}px`,
          height: `${REF_HEIGHT}px`,
          transform: `scale(min(1, calc(100vw / ${REF_WIDTH}px), calc(100vh / ${REF_HEIGHT}px)))`,
          transformOrigin: "center center",
        }}
      >
        {/* ── Visual layer (no pointer events) ───────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${cx}px`,
            top: `${cy}px`,
            width: `${BUTTON_WIDTH}px`,
            height: `${BUTTON_HEIGHT}px`,
            marginLeft: `-${BUTTON_WIDTH / 2}px`,
            marginTop: `-${BUTTON_HEIGHT / 2}px`,
            borderRadius: "17.444px",
            backgroundColor: bgColor,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            transition: visualTransition,
            pointerEvents: "none",
          }}
        >
          <span
            className="font-drowner absolute whitespace-nowrap text-[#0e0e0d]"
            style={{
              left: "21.03%",
              right: "21.51%",
              top: "20.05%",
              bottom: "19.78%",
              fontSize: "199.389px",
              letterSpacing: "3.9878px",
              lineHeight: "normal",
            }}
          >
            see all
          </span>
          <span
            className="font-nanum-pen absolute text-center whitespace-nowrap text-[#e82803] lowercase"
            style={{
              left: "56.99%",
              right: 0,
              top: 0,
              bottom: "60.99%",
              // Shrunk from 101.706px (which fit the old "(2390)") so the longer string still
              // clears its box on one line - measured in the browser at ~92.7% of that size before
              // it touches the "see all" headline above it.
              fontSize: "90px",
              letterSpacing: "-9.1535px",
              lineHeight: 1.4,
            }}
          >
            (2390 projects)
          </span>
        </div>

        {/* ── Hit-area overlay (transparent, events only) ─────────────────
            Uses width/height/left/top transitions (not transform) so the
            DOM event area is always aligned with the visual button above.  */}
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: "absolute",
            left: `${BUTTON_LEFT}px`,
            top: `${BUTTON_TOP}px`,
            width: `${BUTTON_WIDTH}px`,
            height: `${BUTTON_HEIGHT}px`,
          }}
        >
          <button
            type="button"
            onClick={handleClick}
            aria-label={
              phase === "ready"
                ? "See all 2390 projects. Click to open the project list."
                : "See all 2390 projects. Hover and hold until it stops shrinking, then click."
            }
            style={{
              position: "absolute",
              left: `${hitLeft}px`,
              top: `${hitTop}px`,
              width: `${hitW}px`,
              height: `${hitH}px`,
              borderRadius: "17.444px",
              background: "transparent",
              cursor: "pointer",
              transition: hitTransition,
              outline: "none",
              border: "none",
            }}
          />
        </div>
      </div>
    </section>
  );
}
