"use client";

import { useEffect, useState } from "react";

// How many full 0-9 passes a reel spins through before settling on its digit. Enough to read as
// a spin rather than a jump, without the strip getting so tall it costs real layout.
const SPIN_CYCLES = 4;
const SPIN_BASE_MS = 1100;
// Each reel to the right runs longer than the one before it, so they settle left-to-right the way
// a mechanical odometer does instead of all stopping on the same frame.
const SPIN_STAGGER_MS = 160;
// A hard ease-out - most of the travel happens up front and the reel crawls into its final digit.
const SPIN_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

// One reel: a vertical strip of digits inside a fixed-height window, translated so the target
// digit lands in view. The strip repeats 0-9 (SPIN_CYCLES + 1) times purely so there is something
// to travel past - only the last pass is ever the resting position.
//
// Width is deliberately left to the content: the strip holds all ten digits, so it settles at the
// width of the widest one and every reel comes out identically wide without a hand-tuned figure
// that would need re-tuning per font size.
function Reel({ digit, index, cellHeight }: { digit: number; index: number; cellHeight: number }) {
  const [spun, setSpun] = useState(false);

  // One tick at the far end of the frame so the browser paints the resting-at-zero strip before
  // the transition to the target digit starts - without the gap React batches both and nothing
  // animates. A changed digit remounts this reel (see the key below), so this runs again per
  // change and the reels re-spin rather than snapping.
  useEffect(() => {
    const timer = setTimeout(() => setSpun(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const restingIndex = SPIN_CYCLES * 10 + digit;

  return (
    <span className="inline-block overflow-hidden" style={{ height: `${cellHeight}px` }}>
      <span
        className="block"
        style={{
          transform: `translateY(-${(spun ? restingIndex : 0) * cellHeight}px)`,
          transition: spun
            ? `transform ${SPIN_BASE_MS + index * SPIN_STAGGER_MS}ms ${SPIN_EASING}`
            : "none",
        }}
      >
        {Array.from({ length: (SPIN_CYCLES + 1) * 10 }, (_, i) => (
          <span key={i} className="flex items-center justify-center" style={{ height: `${cellHeight}px` }}>
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  );
}

// A number rendered as a bank of slot-machine reels. Inherits font, size and colour from wherever
// it is placed, so it reads as the same lettering as the text around it - only `cellHeight` (the
// window each digit shows through) has to be passed in.
//
// Digits only, no thousands separator: a comma sits on the baseline while the digits are centred
// in their windows, so it would float oddly against them - and a grouped odometer isn't really
// the thing being imitated anyway.
export default function CounterReels({ value, cellHeight }: { value: number; cellHeight: number }) {
  const digits = String(Math.trunc(value)).split("").map(Number);

  return (
    <span className="inline-flex" style={{ height: `${cellHeight}px` }}>
      {/* Each strip holds all ten digits several times over, so left in the accessibility tree
          the count reads out as a couple of hundred loose numerals. The reels are hidden from it
          entirely and this carries the actual value instead. */}
      <span className="sr-only">{value}</span>
      {/* select-none for the same reason: the strips are real rendered text, so without it a
          select-all over the page drags in every digit each reel can show. */}
      <span className="inline-flex select-none" aria-hidden="true">
        {digits.map((digit, i) => (
          <Reel
            // Keyed on both, so a reel whose digit changes remounts and spins again from zero,
            // while two reels that happen to show the same digit stay distinct elements.
            key={`${i}-${digit}`}
            digit={digit}
            index={i}
            cellHeight={cellHeight}
          />
        ))}
      </span>
    </span>
  );
}
