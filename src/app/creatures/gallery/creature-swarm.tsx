"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { PublicCreature } from "@/lib/creatures";

const MIN_SIZE = 64; // floor size once the gallery is crowded - what creatures render at today
const MAX_SIZE = 140; // size when there are only a couple of creatures around
const SIZE_DECAY = 10; // roughly how many creatures it takes to fall most of the way to MIN_SIZE
const BASE_SIZE = 64; // the size SPACING/rotate/scale below were tuned against

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~137.5deg, the sunflower-seed spiral angle

// A small deterministic hash so a creature's tilt/scale stays put across renders instead of
// rerolling on every request - same idea as a seeded random, just inlined since this is a plain
// function of the id rather than something that needs a stateful generator.
function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

// A creature's 16x16 grid used to be 256 individual <div>s - fine for one creature, but a gallery
// with a couple hundred of them meant 50,000+ DOM nodes, and every visitor's browser had to lay
// out and paint all of it on first load and again on every resize. Baking each creature down to a
// single small raster image (cached by id, computed at most once per id ever) cuts that to one
// DOM node per creature - image-rendering: pixelated keeps it crisp at any display size, and as a
// bonus a canvas has no subpixel seams to bleed over in the first place.
const CANVAS_RES = 64;
const imageCache = new Map<string, string>();

function buildCreatureImage(pixels: (string | null)[]): string {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_RES;
  canvas.height = CANVAS_RES;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const cell = CANVAS_RES / 16;
  for (let i = 0; i < pixels.length; i++) {
    const color = pixels[i];
    if (!color) continue;
    const col = i % 16;
    const row = Math.floor(i / 16);
    ctx.fillStyle = color;
    ctx.fillRect(col * cell, row * cell, cell, cell);
  }
  return canvas.toDataURL();
}

// Only ever called from render passes that are guaranteed client-side (see `ready` below) -
// building a canvas during a server render would throw, since there's no DOM there at all.
function getCreatureImageUrl(creature: PublicCreature): string {
  const cached = imageCache.get(creature.id);
  if (cached) return cached;
  const url = buildCreatureImage(creature.pixels);
  imageCache.set(creature.id, url);
  return url;
}

// True from the client's first post-hydration render onward, false during the server render and
// the client's matching first pass - the standard React pattern for "is this safe to touch the
// DOM/canvas yet," since it doesn't need cascading setState-in-effect the way a plain
// useState+useEffect flag would (there's genuinely nothing to subscribe to here, this only ever
// flips once).
function useIsHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// Fits the whole cluster inside the viewport rather than letting it get clipped at the edges (the
// crowd only grows outward as more creatures arrive, so on a narrow phone it can easily end up
// wider than the screen). Read live rather than baked into the swarm's own size math, since the
// same board has to fit differently on a phone versus a wide desktop window.
function useFitScale(boardSize: number) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      const maxWidth = window.innerWidth * 0.92;
      const maxHeight = window.innerHeight * 0.6;
      setScale(Math.min(1, maxWidth / boardSize, maxHeight / boardSize));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [boardSize]);

  return scale;
}

export default function CreatureSwarm({ creatures }: { creatures: PublicCreature[] }) {
  // Tapping a creature reveals its name and brings it to the front - :hover alone never fires on
  // a touch device, so without this the name label and hover-driven z-index bump both never show
  // up on mobile at all, only on a mouse.
  const [activeId, setActiveId] = useState<string | null>(null);

  // Next.js server-renders this component too, and there's no canvas/document on the server -
  // `ready` stays false for that pass and for the client's first (hydration) pass so the two
  // match exactly, then flips true right after mount. Every render from then on (including ones
  // triggered by a poll bringing in creatures we've never imaged before) is guaranteed
  // client-side, so building an image inline during render is safe from that point on.
  const ready = useIsHydrated();

  const size = creatures.length === 0 ? 0 : computeSize(creatures.length);
  // A real drawing rarely fills its whole 16x16 square - most have transparent margins around an
  // irregular silhouette, so spacing tuned for solid squares left visible gaps between neighbors.
  // 18 (down from 30) packs the spiral tight enough that those gaps close up under typical
  // overlap/rotation, at the cost of more overlap for anyone who does draw edge-to-edge.
  const spacing = 18 * (size / BASE_SIZE);

  const placed = creatures.map((creature, index) => {
    // Sunflower-seed (phyllotaxis) spiral: creature 0 sits dead center, and each following one
    // turns a fixed golden angle further round at a radius growing with sqrt(index). Unlike a
    // grid, positions are continuous - creatures land close enough to overlap at the edges, like
    // a pile of stickers stuck onto a board, rather than sitting in neat, evenly spaced cells.
    const angle = index * GOLDEN_ANGLE;
    const radius = spacing * Math.sqrt(index);
    // Rounded rather than left at full float precision - the browser reformats an inline style's
    // px values when it parses the server-rendered HTML, so an unrounded number here made React's
    // hydration check see the server's (browser-reformatted) string and the client's (raw JS
    // number) string as "different," even though they're the same position to well under a pixel.
    const x = Math.round(Math.cos(angle) * radius * 100) / 100;
    const y = Math.round(Math.sin(angle) * radius * 100) / 100;

    const rotate = (hash(`${creature.id}-r`) - 0.5) * 50; // -25..25deg sticker tilt
    const scale = 0.85 + hash(`${creature.id}-s`) * 0.35; // 0.85..1.2, so they're not all identical

    return { creature, x, y, rotate, scale };
  });

  const maxOffset = placed.reduce((max, p) => Math.max(max, Math.abs(p.x), Math.abs(p.y)), 0);
  const boardSize = maxOffset * 2 + size * 2;
  const fitScale = useFitScale(boardSize || 1);

  if (creatures.length === 0) return null;

  return (
    <div style={{ width: boardSize * fitScale, height: boardSize * fitScale }}>
      {/* z-index: 0 (not left at the default `auto`) plus the transform below makes this its own
          stacking context on purpose - a tapped/hovered creature's z-index: 9999 (see `active`
          below) only ever competes against its siblings in here, and can never escape above
          site-wide fixed elements like the nav menu (z-[55] in site-nav.tsx) further up the tree. */}
      <div
        className="relative"
        style={{
          width: boardSize,
          height: boardSize,
          transform: `scale(${fitScale})`,
          transformOrigin: "top left",
          zIndex: 0,
        }}
      >
        {placed.map(({ creature, x, y, rotate, scale }, i) => {
          const active = activeId === creature.id;
          return (
            // "group" is for the hover name label and wiggle below - the tilt/scale live on the
            // inner div instead of here, so they stay upright and don't tilt along with the sticker.
            // z-index comes from the --z custom property (read by .creature-slot in globals.css)
            // rather than a plain inline `zIndex`, so the :hover rule there can override it - an
            // inline zIndex would otherwise always beat a stylesheet rule. Tapping sets an actual
            // inline zIndex instead (see `active` below), since that's a deliberate JS-driven
            // override rather than something a stylesheet rule needs to win against.
            <div
              key={creature.id}
              className="group creature-slot absolute cursor-pointer"
              onClick={() => setActiveId((prev) => (prev === creature.id ? null : creature.id))}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: "translate(-50%, -50%)",
                // A custom property always round-trips through the DOM as a string (CSSOM has no
                // "number" type for them), so passing the raw number here made React see a
                // number-vs-string mismatch between its server and client renders. Stringifying
                // it upfront means both sides agree from the start.
                "--z": String(i),
                ...(active ? { zIndex: 9999 } : {}),
              } as CSSProperties}
            >
              <div
                className="creature-sticker"
                style={{ "--creature-rotate": `${rotate}deg`, "--creature-scale": String(scale) } as CSSProperties}
              >
                {ready ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a locally-generated data: URL, not an optimizable remote image
                  <img
                    src={getCreatureImageUrl(creature)}
                    alt=""
                    draggable={false}
                    style={{ width: size, height: size, imageRendering: "pixelated" }}
                  />
                ) : (
                  <div style={{ width: size, height: size }} />
                )}
              </div>
              {/* Plain cursive text rather than a tooltip/pill - CSS-only and instant, unlike the
                  native title tooltip's OS-controlled delay. Shown on hover (desktop) or tap
                  (touch, via `active`) - a touch device never triggers :hover on its own. */}
              <span
                className={`font-nanum-pen pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full text-[20px] leading-none whitespace-nowrap text-[#0e0e0d] transition-opacity group-hover:opacity-100 ${
                  active ? "opacity-100" : "opacity-0"
                }`}
              >
                {creature.name}
              </span>
              <span className="sr-only">{creature.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Every creature shares one size, driven by how crowded the gallery currently is: a mostly empty
// board shows big, easy-to-see creatures, and each new arrival nudges everyone a little smaller
// (an exponential decay toward MIN_SIZE) so hundreds of them can still pile up near the center
// without turning into an unreadable wall.
function computeSize(count: number) {
  return Math.round(MIN_SIZE + (MAX_SIZE - MIN_SIZE) * Math.exp(-count / SIZE_DECAY));
}
