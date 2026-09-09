"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// The three of us, in the order the credit line reads. `role` is written first-person on purpose -
// the overlay is meant to read like whoever you're pointing at leaning in and saying what they
// did, not like an about page. Later entries overlap earlier ones, so this order also decides the
// stack: habeeb ends up on top.
const MAKERS = [
  { name: "nandana", role: "i built the design language", src: "/nandu.png" },
  { name: "achuth", role: "i wrote code", src: "/achuth.png" },
  { name: "habeeb", role: "i built the ui and experience", src: "/habeeb.png" },
] as const;

// Whether this is a real pointer that can hover, read straight off the media query rather than
// mirrored into state - a `useEffect` that setStates on mount is exactly the cascading render the
// lint rule (and React) tells you to avoid. The server snapshot is `false`, so the first paint
// assumes touch and the hover handlers only attach once the client confirms a mouse.
const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

const subscribeToHover = (onChange: () => void) => {
  const query = window.matchMedia(HOVER_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

// Hovering "made" in the footer blurs the page and floats the three of us in just above the word.
//
// Everything here is a <span> rather than a <div>: this renders inside the footer's <p>, and a
// <div> in a <p> is invalid HTML that the browser silently reshapes (it closes the paragraph
// early), which puts the server and client DOM out of step. Spans carrying `block`/`flex` get the
// same layout without breaking the paragraph.
export default function MadeByOverlay() {
  const [open, setOpen] = useState(false);
  // Which portrait is being pointed at - the captions only exist while one of us is picked out.
  const [focused, setFocused] = useState<string | null>(null);
  // Hover-driven opening and closing is for real pointers only. On touch the overlay is a tap
  // target that stays put until you tap somewhere else, so every mouse-shaped handler below is
  // gated on this - the same "hover is CSS-only, tap needs its own path" split globals.css uses
  // for the creature stickers.
  const hoverable = useSyncExternalStore(
    subscribeToHover,
    () => window.matchMedia(HOVER_QUERY).matches,
    () => false,
  );
  // Hovering off the word shouldn't kill the overlay instantly - the pointer needs a moment to
  // travel from the word up to the portraits, so closing is deferred and cancelled if it gets
  // there.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setFocused(null);
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(close, 260);
  }, [cancelClose, close]);

  const openNow = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  return (
    <span className="relative inline-block">
      {/* The blur layer. Sits below the credit line's own z-index (see the wrapper below) so the
          word you're hovering stays sharp and keeps receiving the hover - covering it would make
          the pointer leave the trigger the instant the overlay opened, and the two would then
          fight each other open/closed. On touch this is also the only way out. */}
      <span
        aria-hidden="true"
        style={{ opacity: open ? 1 : 0 }}
        onClick={close}
        className={`fixed inset-0 z-[70] block bg-white/45 backdrop-blur-xl transition-opacity duration-300 ease-out ${
          open ? "" : "pointer-events-none"
        }`}
      />

      <span
        className="relative z-[71] inline-block"
        onMouseEnter={hoverable ? openNow : undefined}
        onMouseLeave={hoverable ? scheduleClose : undefined}
      >
        <button
          type="button"
          // Only ever opens - the backdrop, Escape and moving off the portraits are what close it.
          // A toggle here would read as broken on desktop, where the hover has already opened it
          // by the time the click lands. Tap is the touch equivalent, focus the keyboard one.
          onClick={openNow}
          onFocus={openNow}
          onBlur={hoverable ? scheduleClose : undefined}
          aria-expanded={open}
          // The negative margins claw back the padding so the enlarged hit area doesn't push the
          // credit line around - the word is only ~25x15px on its own, which is a mean target to
          // ask someone to find at the bottom of the page.
          className="-mx-1 -my-2 cursor-pointer px-1 py-2 underline decoration-dotted decoration-[#ea34df] underline-offset-4 transition-opacity hover:opacity-70"
        >
          made
        </button>
      </span>

      {/* Anchored to the word rather than the middle of the screen, so the portraits read as
          coming out of the credit line. */}
      <span
        aria-hidden={!open}
        style={{
          opacity: open ? 1 : 0,
          transform: `translate(-50%, ${open ? "0" : "6px"})`,
        }}
        onMouseEnter={hoverable ? cancelClose : undefined}
        // Leaving the whole cluster closes it, so on a mouse it behaves like one long hover that
        // started on the word. The portraits don't get their own leave handler - that would fire
        // while sliding between them.
        onMouseLeave={
          hoverable
            ? () => {
                setFocused(null);
                scheduleClose();
              }
            : undefined
        }
        className={`absolute bottom-full left-1/2 z-[72] mb-3 flex items-end transition-[opacity,transform] duration-300 ease-out ${
          open ? "" : "pointer-events-none"
        }`}
      >
        {MAKERS.map((maker, index) => {
          const isFocused = focused === maker.name;
          // Dimmed only once someone else is picked out, so the resting state is all three of us
          // equally present.
          const dimmed = focused !== null && !isFocused;
          return (
            <span
              key={maker.name}
              onMouseEnter={hoverable ? () => setFocused(maker.name) : undefined}
              // Touch needs its own path: a tap's simulated mouseover isn't dependable, and
              // without this the portraits would be unlabelled on phones. A tap sticks until
              // something else is tapped. It can't reach the backdrop's close handler from here -
              // that's a sibling, not an ancestor.
              onClick={() => setFocused(maker.name)}
              style={{
                // Each portrait laps the one before it, so they read as a small stack rather than
                // a row. Whoever is picked out comes to the front - underlapped, the enlarged
                // portrait would be sliced by its neighbour.
                marginLeft: index === 0 ? 0 : "var(--stack-lap)",
                zIndex: isFocused ? MAKERS.length + 1 : index + 1,
              }}
              className="relative block [--stack-lap:-20px] lg:[--stack-lap:-24px]"
            >
              {/* Sits directly over this portrait's head rather than over the middle of the row,
                  and outside the scaled/greyscaled circle below so the type stays crisp and
                  full-size. The stack is narrow enough that a caption centred on the outermost
                  portrait still lands fully on screen. */}
              <span
                aria-hidden={!isFocused}
                style={{ opacity: isFocused ? 1 : 0 }}
                // No fade: each caption sits over its own portrait, so two of them at different
                // x positions crossfading into each other just reads as overlapping text. Labels
                // want to snap.
                className="pointer-events-none absolute bottom-full left-1/2 mb-4 block w-[168px] -translate-x-1/2 text-center lg:w-[210px]"
              >
                <span className="font-drowner block text-[17px] leading-none text-[#0e0e0d] lowercase">
                  {maker.name}
                </span>
                <span className="font-nanum-pen mt-1 block text-[13px] leading-[1.25] text-[#0e0e0d]/70">
                  {maker.role}
                </span>
              </span>

              {/* opacity/filter/transform ride on inline styles rather than utility classes
                  because they are the properties that actually animate here, and inline values
                  can't be outranked by anything in the cascade - the same reasoning globals.css
                  gives for keeping the creature-sticker transforms in custom properties. No
                  border or ring on purpose: colour-against-greyscale and the scale-up are what
                  mark out whoever is picked, so the photos sit bare against the blur. */}
              <span
                style={{
                  opacity: dimmed ? 0.5 : 1,
                  filter: dimmed ? "grayscale(1)" : "grayscale(0)",
                  transform: isFocused ? "scale(1.12)" : "scale(1)",
                }}
                className="relative block size-[42px] overflow-hidden rounded-full transition-[opacity,filter,transform] duration-300 ease-out lg:size-[52px]"
              >
                {/* `sizes` deliberately overstates the box (which is 42-52px) so next/image
                    fetches the 128px-wide variant rather than the 64px one. At the real layout
                    width the served file is a 1:1 match for a 1x screen and visibly soft on the
                    2-3x screens these are actually looked at on; asking for a denser source is
                    what buys the sharpness back. Bumping `quality` instead would do nothing -
                    Next 16 defaults `images.qualities` to [75] and snaps anything else to it. */}
                <Image src={maker.src} alt={maker.name} fill sizes="128px" className="object-cover" />
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
