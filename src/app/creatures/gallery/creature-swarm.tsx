"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { PublicCreature } from "@/lib/creatures";

const MIN_SIZE = 64; // floor size once the gallery is crowded - what creatures render at today
const MAX_SIZE = 140; // size when there are only a couple of creatures around
const SIZE_DECAY = 10; // roughly how many creatures it takes to fall most of the way to MIN_SIZE

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~137.5deg, the sunflower-seed spiral angle
const RADIUS_POWER = 0.6; // see the comment where this is used, in the placement loop below

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

// A real drawing almost never fills its whole 16x16 square - most have transparent margins around
// an irregular silhouette (a thin stick figure, a small compact blob, whatever). A single fixed
// spacing constant tuned for one guess at "typical coverage" either leaves gaps (whenever actual
// creatures are sparser than the guess) or looks needlessly cluttered (whenever they're denser) -
// it can't win for every gallery. This measures each creature's actual reach (the farthest any
// filled pixel sits from its own center) and spaces the spiral by the population's *own* average,
// so the layout adapts to whatever people have actually drawn instead of a guess.
function inkRadius(pixels: (string | null)[]): number {
  let maxDistSq = 0;
  for (let i = 0; i < pixels.length; i++) {
    if (!pixels[i]) continue;
    const col = i % 16;
    const row = Math.floor(i / 16);
    const dx = col - 7.5;
    const dy = row - 7.5;
    const distSq = dx * dx + dy * dy;
    if (distSq > maxDistSq) maxDistSq = distSq;
  }
  // A creature with nothing filled can't happen (the submit route requires 10+ pixels), but a
  // small floor keeps this sane if that rule ever changes.
  return maxDistSq === 0 ? 2 : Math.sqrt(maxDistSq) + 0.5;
}

// Every creature's clickable/hoverable area used to be its full 16x16 square, padding and all -
// which is mostly transparent for a typical drawing. Once creatures overlap (the whole point of
// the spiral layout), a square that size sitting on top completely blocks the empty margin of
// whatever's underneath it too, even where neither creature has anything actually drawn - so a
// creature boxed in on all sides could never be hovered or tapped at all, no matter how much open
// canvas space was visually around it. This finds the tight rectangle around a creature's actual
// drawn pixels, so its hit-target only ever covers what it actually drew.
function inkBounds(pixels: (string | null)[]): { minCol: number; maxCol: number; minRow: number; maxRow: number } {
  let minCol = 15;
  let maxCol = 0;
  let minRow = 15;
  let maxRow = 0;
  for (let i = 0; i < pixels.length; i++) {
    if (!pixels[i]) continue;
    const col = i % 16;
    const row = Math.floor(i / 16);
    if (col < minCol) minCol = col;
    if (col > maxCol) maxCol = col;
    if (row < minRow) minRow = row;
    if (row > maxRow) maxRow = row;
  }
  // Same "can't actually happen" guard as inkRadius above - falls back to the full square.
  return minCol > maxCol ? { minCol: 0, maxCol: 15, minRow: 0, maxRow: 15 } : { minCol, maxCol, minRow, maxRow };
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
  const cellPx = size / 16;

  // A flat population-average spacing treats every creature as if it took up the same amount of
  // room - so a sparse, tightly-drawn creature (small actual ink reach) still gets pushed exactly
  // as far from its neighbors as a sprawling one, leaving a visible gap around it, while a bigger
  // one sitting near several other big ones can end up too tightly packed. Accumulating each
  // creature's own ink reach as we go (as an "area" - inkRadius squared, since area scales with
  // radius squared) and basing each creature's distance from center on the running total up to
  // that point, rather than a shared average, spaces every gap by what's actually sitting on
  // either side of it instead of a population-wide guess.
  const OVERLAP = 0.55;
  const avgInkRadiusPx =
    creatures.length === 0 ? 0 : (creatures.reduce((sum, c) => sum + inkRadius(c.pixels), 0) / creatures.length) * cellPx;
  // Coefficient chosen so that a population of uniformly-sized creatures reduces to the same
  // radius formula as the flat-average version this replaced (spacing * index^RADIUS_POWER) -
  // the adaptivity below only matters once individual creatures start deviating from that average.
  const areaCoeff =
    avgInkRadiusPx === 0 ? 0 : ((2 * OVERLAP) / Math.sqrt(Math.PI)) * Math.pow(avgInkRadiusPx, 1 - 2 * RADIUS_POWER);

  // Own footprint ("area", i.e. inkRadius squared) per creature, and - for each one - the running
  // total of every earlier creature's footprint. Built as a plain prefix sum rather than a mutable
  // accumulator inside the placement loop below, since React's compiler flags reassigning a
  // variable across render (it can't tell a `let` scoped to this render call apart from state).
  const ownInkAreas = creatures.map((c) => {
    const r = inkRadius(c.pixels) * cellPx;
    return r * r;
  });
  const rawCumulativeInkAreaBefore = ownInkAreas.map((_, i) => ownInkAreas.slice(0, i).reduce((sum, a) => sum + a, 0));
  // Whichever handful of creatures happen to land first in submission order sets how tightly
  // *every* gallery packs near dead center, since there's so little accumulated area yet to base
  // their spacing on - if those happen to be smaller/plainer drawings (common for whoever
  // submitted early on), the middle of the spiral clumps far tighter than the "pile of stickers"
  // look intended anywhere else. Flooring the running total at what an average-sized population
  // would have accumulated by this point keeps that from happening, while never kicking in once
  // real creatures have actually built up more area than that (so it doesn't loosen anything else).
  const MIN_AREA_FRACTION = 1.1;
  const cumulativeInkAreaBefore = rawCumulativeInkAreaBefore.map((cum, i) =>
    Math.max(cum, MIN_AREA_FRACTION * avgInkRadiusPx * avgInkRadiusPx * i)
  );

  const placed = creatures.map((creature, index) => {
    // Sunflower-seed (phyllotaxis) spiral: creature 0 sits dead center, and each following one
    // turns a fixed golden angle further round. Unlike a grid, positions are continuous -
    // creatures land close enough to overlap at the edges, like a pile of stickers stuck onto a
    // board, rather than sitting in neat, evenly spaced cells.
    const angle = index * GOLDEN_ANGLE;
    // A pure sqrt of the running total spaces every ring at constant density, which is only
    // "even" in the limit of many creatures - with real gallery counts, the handful of low-index
    // creatures near dead center end up looking like a bare gap next to how packed the outer rings
    // get. A slightly higher exponent keeps that inner ring tighter while easing later rings
    // further apart, trading the theoretical even density for what actually reads as even by eye.
    const radius = areaCoeff * Math.pow(cumulativeInkAreaBefore[index], RADIUS_POWER);
    // Rounded rather than left at full float precision - the browser reformats an inline style's
    // px values when it parses the server-rendered HTML, so an unrounded number here made React's
    // hydration check see the server's (browser-reformatted) string and the client's (raw JS
    // number) string as "different," even though they're the same position to well under a pixel.
    const x = Math.round(Math.cos(angle) * radius * 100) / 100;
    const y = Math.round(Math.sin(angle) * radius * 100) / 100;

    const rotate = (hash(`${creature.id}-r`) - 0.5) * 50; // -25..25deg sticker tilt
    const scale = 0.85 + hash(`${creature.id}-s`) * 0.35; // 0.85..1.2, so they're not all identical

    // The hit-target rectangle (see inkBounds above), scaled and centered to match this creature's
    // own rendered size - `scale` already stretches the visible sticker by the same factor, so the
    // clickable area needs to grow with it or a bigger-than-average sticker would end up with a
    // hit-target smaller than what's actually drawn on screen.
    const bounds = inkBounds(creature.pixels);
    const hitWidth = Math.round((bounds.maxCol - bounds.minCol + 1) * cellPx * scale * 100) / 100;
    const hitHeight = Math.round((bounds.maxRow - bounds.minRow + 1) * cellPx * scale * 100) / 100;
    // Offset of the hit rectangle's own center from the sticker's center (grid col/row 8, the same
    // reference point inkRadius above measures distance from), in the same rounded px terms as x/y.
    const hitOffsetX = Math.round(((bounds.minCol + bounds.maxCol + 1) / 2 - 8) * cellPx * scale * 100) / 100;
    const hitOffsetY = Math.round(((bounds.minRow + bounds.maxRow + 1) / 2 - 8) * cellPx * scale * 100) / 100;

    return { creature, x, y, rotate, scale, hitWidth, hitHeight, hitOffsetX, hitOffsetY };
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
        className="relative creature-board"
        // Tapping empty board space (anywhere that isn't a creature's own hit-target, which stops
        // this from firing - see its onClick below) clears the active one back to normal. Without
        // this, a tapped creature had no way back to its resting size on a touch device short of
        // tapping that exact same creature again - not something a phone screen full of
        // overlapping stickers makes obvious or reliable to land on twice.
        onClick={() => setActiveId(null)}
        style={{
          width: boardSize,
          height: boardSize,
          transform: `scale(${fitScale})`,
          transformOrigin: "top left",
          zIndex: 0,
        }}
      >
        {placed.map(({ creature, x, y, rotate, scale, hitWidth, hitHeight, hitOffsetX, hitOffsetY }, i) => {
          const active = activeId === creature.id;
          // Tap/click has no CSS :hover to hook into the way a mouse does (see the .creature-board
          // :has() rule in globals.css for that side) - this is the same blur, applied inline, for
          // whichever creature isn't the one currently tapped.
          const blurredByTap = activeId !== null && !active;
          return (
            // "group" is for the hover name label and wiggle below - the tilt/scale live on the
            // inner sticker div instead of here, so they stay upright and don't tilt along with it.
            // z-index comes from the --z custom property (read by .creature-slot in globals.css)
            // rather than a plain inline `zIndex`, so the :hover rule there can override it - an
            // inline zIndex would otherwise always beat a stylesheet rule. Tapping sets an actual
            // inline zIndex instead (see `active` below), since that's a deliberate JS-driven
            // override rather than something a stylesheet rule needs to win against. This whole
            // wrapper is pointer-events: none - it exists to position and stack the sticker image
            // and the (separately positioned) hit-target below, not to be interacted with itself,
            // since its own box is the full padded square. Hovering the hit-target still counts as
            // hovering this element as far as :hover/group-hover go (that follows the actual
            // pointer target's ancestor chain, not this element's own pointer-events value) -
            // pointer-events only decides who gets picked as the hit target in the first place.
            <div
              key={creature.id}
              className="group creature-slot absolute"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                // A custom property always round-trips through the DOM as a string (CSSOM has no
                // "number" type for them), so passing the raw number here made React see a
                // number-vs-string mismatch between its server and client renders. Stringifying
                // it upfront means both sides agree from the start.
                "--z": String(i),
                ...(active ? { zIndex: 9999 } : {}),
              } as CSSProperties}
            >
              <div
                className={`creature-sticker ${active ? "creature-sticker--active" : ""}`}
                style={
                  {
                    "--creature-rotate": `${rotate}deg`,
                    "--creature-scale": String(scale),
                    ...(blurredByTap ? { filter: "blur(3px)" } : {}),
                  } as CSSProperties
                }
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
              {/* The actual hit-target: sized and centered to just this creature's own drawn
                  pixels (see inkBounds), not the full sticker square, so a neighbor sitting in the
                  transparent margin around it stays reachable. */}
              <div
                className="absolute cursor-pointer"
                // Stops the board's own onClick (see above) from firing right after this one for
                // the same tap and immediately clearing back to null what this just set.
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveId((prev) => (prev === creature.id ? null : creature.id));
                }}
                style={{
                  left: `calc(50% + ${hitOffsetX}px)`,
                  top: `calc(50% + ${hitOffsetY}px)`,
                  width: hitWidth,
                  height: hitHeight,
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "auto",
                }}
              >
                <span className="sr-only">{creature.name}</span>
              </div>
              {/* Plain cursive text rather than a tooltip/pill - CSS-only and instant, unlike the
                  native title tooltip's OS-controlled delay. Shown on hover (desktop) or tap
                  (touch, via `active`) - a touch device never triggers :hover on its own. Anchored
                  to the sticker's own center (not the small hit-target above) with a fixed
                  clearance big enough for the *enlarged* sticker (up to ~2.2x its resting size,
                  see .creature-sticker--active/creature-wiggle in globals.css) - anchoring it to
                  the hit-target's edge left it sitting right where the enlarged art now reaches,
                  covering its own name. */}
              <span
                className={`font-nanum-pen pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-full leading-none whitespace-nowrap text-[#0e0e0d] transition-opacity group-hover:text-[34px] group-hover:opacity-100 ${
                  active ? "text-[34px] opacity-100" : "text-[20px] opacity-0"
                }`}
                style={{ top: `calc(50% - ${Math.round(size * 1.4)}px)` }}
              >
                {creature.name}
              </span>
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
