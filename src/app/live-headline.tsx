"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import CounterReels from "./counter-reels";

/**
 * The live-state headline, pixel-matched to the Figma reference. Two nodes went into this: node
 * 444:818 ("MacBook Air - 36", the composed screen) placed the component among the page's other
 * decorations, and node 448:990 ("Frame 83") is the isolated component itself - cleaner and more
 * precise, since the composed instance had picked up small offsets from being dropped into a
 * wider layout. The ratios below come from 448:990.
 *
 * Every row is positioned absolutely at the exact `top` Figma reports for it, the same way
 * Figma's own export expresses the layout - sidestepping the drift that came from approximating
 * gaps with margins, where each margin only had to be roughly right and so needed re-tuning every
 * time this component's content changed shape. An absolute top is exactly right regardless of
 * what changes around it.
 *
 * Every offset is computed in real pixels from the numeric `fontSize` prop rather than left as a
 * CSS `em` value: a `top` in `em` resolves against the element's own computed font-size, not its
 * parent's, so a row that also rescales its own font-size (makers, the campus line) got its `top`
 * silently multiplied by the wrong base. Doing the multiplication in JS means there is only ever
 * one font-size in play per calculation.
 *
 * "makers" and the campus line are then stretched with a horizontal-only `scale` so their
 * rendered width matches the number's rendered width exactly - not by sizing their container to
 * the number's box (that div width isn't what anyone sees), but by measuring what's actually on
 * screen and matching that. A fixed ratio can't do this: "makers" and "3828" don't scale together
 * as the digit count changes, or as different browsers/platforms render the handwritten font's
 * glyphs at very slightly different widths.
 *
 * The campus count is a fixed 71, not derived from the venue roster (which currently holds 72 -
 * one entry in there is wrong, not yet tracked down) or from Metabase (also 71, but the live
 * count is deliberately not wired to this word for its own sake - a number that could silently
 * drift with a database value shouldn't back a headline stat without a decision to make it live).
 */
// Added on top of the Figma-matched number/makers/place offsets below, pushing all three of them
// (and the container's own height) down together by the same amount - so the extra room lands
// only in the one gap asked for (kicker to number) rather than also stretching number-to-makers
// or makers-to-place, which stay exactly as tight as Figma had them.
const KICKER_GAP_BOOST = 0.11;

const ROW_TOP_RATIO = {
  kicker: 0,
  number: 0.12641 + KICKER_GAP_BOOST,
  makers: 0.7797 + KICKER_GAP_BOOST,
  place: 1.49185 + KICKER_GAP_BOOST,
} as const;

// Where the lockup's bottom edge sits, in the same ratio - the height a caller needs to clear
// with whatever comes after it (see LOCKUP_HEIGHT_RATIO in timer-section.tsx, now this exact
// value instead of a screenshot-measured guess). Grows by the same boost as the rows above so the
// container's own bottom doesn't get cut short of where "happening across..." actually ends.
export const LIVE_HEADLINE_HEIGHT_RATIO = 1.77268 + KICKER_GAP_BOOST;

const WORD_SCALE = {
  kicker: 0.17234,
  makers: 0.79889,
  place: 0.17654,
} as const;

const CAMPUS_COUNT = 71;

export default function LiveHeadline({
  registered,
  fontSize,
}: {
  registered: number | null;
  fontSize: number;
}) {
  const top = (ratio: number) => `${Math.round(ratio * fontSize)}px`;
  const size = (ratio: number) => `${Math.round(ratio * fontSize)}px`;

  const rootRef = useRef<HTMLSpanElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const makersRef = useRef<HTMLSpanElement>(null);
  const placeRef = useRef<HTMLSpanElement>(null);

  // The reels spin up once, the first time this panel actually scrolls into view - not at
  // mount. `Reel` (see counter-reels.tsx) starts its climb on its own `useEffect`, unconditionally,
  // the moment it's created; since `registered` arrives as a server prop and is available on this
  // component's very first render, that used to mean the whole animation played out - and finished
  // - before anyone had scrolled anywhere near a section that, on this page, sits at the very
  // bottom. `CounterReels` only gets mounted once `hasEnteredView` flips, so its climb starts
  // exactly when someone can see it, and holds the plain final number (no reel machinery, no
  // motion) until then rather than showing nothing.
  const [hasEnteredView, setHasEnteredView] = useState(false);

  useEffect(() => {
    if (hasEnteredView) return;
    const root = rootRef.current;
    if (!root) return;

    // A live-region reads its own aria-hidden bank of reels as noise, and it's the sr-only span
    // inside CounterReels that carries the real value regardless of which branch is showing - so
    // this is purely about when the *visual* climb happens, not about anything screen readers see.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHasEnteredView(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [hasEnteredView]);

  useLayoutEffect(() => {
    const number = numberRef.current;
    const makers = makersRef.current;
    const place = placeRef.current;
    if (!number || !makers || !place) return;

    // `offsetWidth` rather than a bounding rect: it always reads the untransformed layout box, so
    // re-running this after a `scale` is already applied never measures its own stretched output
    // back into the ratio.
    //
    // A ResizeObserver rather than a one-shot effect, because two instances of this component are
    // always mounted at once - one for mobile, one for desktop - with CSS `hidden` showing only
    // one at a time. The hidden instance's elements measure 0 wide; an effect keyed on `registered`
    // would leave it stuck at whatever it computed while hidden.
    //
    // The observer alone isn't enough, though: it only tracks elements that are actually being
    // rendered, so it never fires when a `display: none` instance becomes visible again - exactly
    // what happens when the viewport crosses the responsive breakpoint. A `resize` listener covers
    // that case, since the CSS media query has already flipped the display before the event fires.
    const stretchToMatch = () => {
      const target = number.offsetWidth;
      if (!target) return;
      if (makers.offsetWidth) makers.style.scale = `${target / makers.offsetWidth} 1`;
      if (place.offsetWidth) place.style.scale = `${target / place.offsetWidth} 1`;
    };

    const observer = new ResizeObserver(stretchToMatch);
    observer.observe(number);
    observer.observe(makers);
    observer.observe(place);
    // Belt and braces alongside `resize`: matchMedia's own change event is the more precise
    // trigger for exactly this condition (it only fires when the breakpoint's truth value
    // actually flips, not on every pixel of a drag), and covers any case - a devtools device
    // toggle, an OS-level zoom change - that updates layout without necessarily firing `resize`.
    const breakpoint = window.matchMedia("(min-width: 1024px)");
    window.addEventListener("resize", stretchToMatch);
    breakpoint.addEventListener("change", stretchToMatch);

    // A handful of follow-up checks over the first second, on top of the observer and both
    // listeners above: cheap insurance against any one-off first-paint race (a slow web font
    // swap, a browser that defers the very first ResizeObserver callback a frame later than
    // usual) landing between "mounted" and "actually settled".
    const settleTimers = [50, 150, 300, 600, 1000].map((delay) => setTimeout(stretchToMatch, delay));

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", stretchToMatch);
      breakpoint.removeEventListener("change", stretchToMatch);
      settleTimers.forEach(clearTimeout);
    };
  }, [registered, fontSize]);

  return (
    <span
      ref={rootRef}
      style={{ height: `${LIVE_HEADLINE_HEIGHT_RATIO * fontSize}px` }}
      className="relative block text-[#100f0f]"
    >
      {/* A concentric two-tone bead, not an inset highlight - the component's own source asset
          (Frame 84 in the Figma file) is two circles sharing one centre, radius 4.5 and 2.5, not
          a highlight offset toward a corner the way a glossy sticker's would be. */}
      <span
        style={{ top: top(ROW_TOP_RATIO.kicker), fontSize: size(WORD_SCALE.kicker) }}
        className="font-nanum-pen absolute left-1/2 flex -translate-x-1/2 items-center gap-[0.3em] leading-[normal] tracking-normal"
      >
        <span className="relative inline-flex size-[0.4em] items-center justify-center rounded-full bg-[#03D330]">
          <span className="size-[56%] rounded-full bg-[#72FF91]" />
        </span>
        live now
      </span>

      <span
        ref={numberRef}
        style={{ top: top(ROW_TOP_RATIO.number), fontSize: `${fontSize}px` }}
        className="font-drowner absolute left-1/2 -translate-x-1/2 leading-[normal] text-black"
      >
        {/* Three states: no count yet (wording, not an empty box), a count that's loaded but
            hasn't been scrolled to yet (the plain final number, no reel machinery), and a count
            that has just scrolled into view (mounts CounterReels, which spins up to this same
            number on its own mount effect - see the hook above for why that timing matters). */}
        {registered === null ? "it's live" : hasEnteredView ? (
          <CounterReels value={registered} cellHeight={fontSize} />
        ) : (
          registered
        )}
      </span>

      <span
        ref={makersRef}
        style={{ top: top(ROW_TOP_RATIO.makers), fontSize: size(WORD_SCALE.makers) }}
        className="font-nanum-pen absolute left-1/2 -translate-x-1/2 leading-[normal] tracking-normal"
      >
        makers
      </span>

      <span
        ref={placeRef}
        style={{ top: top(ROW_TOP_RATIO.place), fontSize: size(WORD_SCALE.place) }}
        className="font-nanum-pen absolute left-1/2 -translate-x-1/2 whitespace-nowrap leading-[normal] tracking-normal"
      >
        happening across {CAMPUS_COUNT} campuses
      </span>
    </span>
  );
}
