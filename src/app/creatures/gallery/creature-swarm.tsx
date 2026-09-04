import type { CSSProperties } from "react";
import type { Creature } from "@/lib/creatures";

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

export default function CreatureSwarm({ creatures }: { creatures: Creature[] }) {
  if (creatures.length === 0) return null;

  // Every creature shares one size, driven by how crowded the gallery currently is: a mostly
  // empty board shows big, easy-to-see creatures, and each new arrival nudges everyone a little
  // smaller (an exponential decay toward MIN_SIZE) so hundreds of them can still pile up near the
  // center without turning into an unreadable wall.
  const size = Math.round(MIN_SIZE + (MAX_SIZE - MIN_SIZE) * Math.exp(-creatures.length / SIZE_DECAY));
  const cellPx = size / 16;
  const spacing = 30 * (size / BASE_SIZE);

  const placed = creatures.map((creature, index) => {
    // Sunflower-seed (phyllotaxis) spiral: creature 0 sits dead center, and each following one
    // turns a fixed golden angle further round at a radius growing with sqrt(index). Unlike a
    // grid, positions are continuous - creatures land close enough to overlap at the edges, like
    // a pile of stickers stuck onto a board, rather than sitting in neat, evenly spaced cells.
    const angle = index * GOLDEN_ANGLE;
    const radius = spacing * Math.sqrt(index);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const rotate = (hash(`${creature.id}-r`) - 0.5) * 50; // -25..25deg sticker tilt
    const scale = 0.85 + hash(`${creature.id}-s`) * 0.35; // 0.85..1.2, so they're not all identical

    return { creature, x, y, rotate, scale };
  });

  const maxOffset = placed.reduce((max, p) => Math.max(max, Math.abs(p.x), Math.abs(p.y)), 0);
  const boardSize = maxOffset * 2 + size * 2;

  return (
    <div className="relative" style={{ width: boardSize, height: boardSize }}>
      {placed.map(({ creature, x, y, rotate, scale }, i) => (
        // "group" is for the hover name label and wiggle below - the tilt/scale live on the
        // inner div instead of here, so they stay upright and don't tilt along with the sticker.
        // z-index comes from the --z custom property (read by .creature-slot in globals.css)
        // rather than a plain inline `zIndex`, so the :hover rule there can override it - an
        // inline zIndex would otherwise always beat a stylesheet rule and the hovered creature
        // could stay buried under later ones.
        <div
          key={creature.id}
          className="group creature-slot absolute"
          style={{
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
            transform: "translate(-50%, -50%)",
            "--z": i,
          } as CSSProperties}
        >
          <div
            className="creature-sticker"
            style={{ "--creature-rotate": `${rotate}deg`, "--creature-scale": scale } as CSSProperties}
          >
            <CreaturePixels pixels={creature.pixels} size={size} cellPx={cellPx} />
          </div>
          {/* Plain cursive text rather than a tooltip/pill - CSS-only and instant, unlike the
              native title tooltip's OS-controlled delay. */}
          <span className="font-nanum-pen pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full text-[20px] leading-none whitespace-nowrap text-[#0e0e0d] opacity-0 transition-opacity group-hover:opacity-100">
            {creature.name}
          </span>
          <span className="sr-only">{creature.name}</span>
        </div>
      ))}
    </div>
  );
}

function CreaturePixels({ pixels, size, cellPx }: { pixels: (string | null)[]; size: number; cellPx: number }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(16, ${cellPx}px)`, width: size, height: size }}>
      {pixels.map((color, i) =>
        color ? (
          // The box-shadow bleeds each cell's own color half a pixel past its edge, covering the
          // hairline gaps browsers otherwise render between adjacent grid cells - needed once the
          // grid gets scaled by a non-integer factor (the sticker scale() above) or cellPx itself
          // isn't a whole number (size varies continuously with the crowd size).
          <div key={i} style={{ backgroundColor: color, boxShadow: `0 0 0 0.75px ${color}` }} />
        ) : (
          <div key={i} />
        )
      )}
    </div>
  );
}
