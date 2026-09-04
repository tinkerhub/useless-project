"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LegoBlock, { PITCH } from "../lego-block";
import { buildSkyline, FALL_ROWS_PER_MS, placeBlock, type Placed } from "../tetris-field";

const TARGET_CELL = 56;
const MIN_COLUMNS = 8;
const MAX_COLUMNS = 44;
// Floor on the gap between one piece landing and the next starting to fall, so a very short
// countdown (few blocks needed per second) still reads as discrete drops rather than a blur.
const MIN_LAND_PAUSE_MS = 110;

// Every piece starts a full board-height above the top of the screen, rather than just a few
// rows of clearance above wherever it happens to land (the hero's own spawnRow) - with exactly
// one piece on screen at a time here, a drop late in the countdown landing near the top of an
// already-full board should still read as falling from the top of the screen, not hopping the
// last row or two into place.
const topSpawnRow = (rows: number) => rows * 2;

/** The one piece currently falling: painted at `topSpawnRow` first, then - once the browser has
 *  actually committed that frame - transitioned down to its landing spot. `cycleMs` is this
 *  block's whole time budget (fall + the pause before the next one starts) - see TimerBoard for
 *  where that comes from. Calls `onLanded` once the full cycle (not just the fall) is done. */
function FallingBlock({
  piece,
  cell,
  unit,
  rows,
  cycleMs,
  onLanded,
}: {
  piece: Placed;
  cell: number;
  unit: number;
  rows: number;
  cycleMs: number;
  onLanded: () => void;
}) {
  const box = placeBlock(piece, cell, unit);
  const [falling, setFalling] = useState(false);

  // The fall itself stays at the hero's own natural speed - snappy - and only ever gets faster,
  // never slower, than that: what stretches to fit a longer countdown is the pause after it,
  // not the drop. A budget shorter than the natural fall (many blocks, very little time) instead
  // speeds the fall up to fit, so the queue can't permanently fall behind schedule.
  const fallRows = topSpawnRow(rows) - piece.bottom;
  const naturalFallMs = fallRows / FALL_ROWS_PER_MS;
  const fallMs = Math.max(1, Math.min(naturalFallMs, cycleMs - MIN_LAND_PAUSE_MS));
  const pauseMs = Math.max(MIN_LAND_PAUSE_MS, cycleMs - fallMs);

  useEffect(() => {
    // Two nested frames, same as the hero's own spawn: the first lets the browser actually paint
    // this block at its spawn position (transition: none), the second - a frame later - flips on
    // the transition and moves it to its landing spot. Collapsing this to one frame (or forcing a
    // layout read instead) isn't enough: a layout read forces a synchronous *reflow*, not a
    // *paint*, so both style states can still land in the same paint and the block just appears
    // at rest with nothing to animate from - which is exactly what a single frame looks like.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFalling(true));
    });
    const id = setTimeout(onLanded, fallMs + pauseMs);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mounted piece (key'd by the caller)
  }, []);

  return (
    <div
      className="absolute"
      style={{
        left: box.left,
        width: box.width,
        height: box.height,
        bottom: falling ? box.bottom : topSpawnRow(rows) * cell,
        transition: falling ? `bottom ${fallMs}ms linear` : "none",
      }}
    >
      <LegoBlock shape={piece.shape} color={piece.color} className="size-full" />
    </div>
  );
}

/**
 * The countdown's background: a lego skyline that fills in one piece at a time, paced by the
 * countdown itself so the board reaches fully flooded right as `remainingMs` hits zero.
 *
 * The board's final layout is built once (see `buildSkyline`, the same deterministic layout the
 * hero's flooded reveal uses) rather than resimulated as it fills - that would reseed the
 * layout's own RNG on every change and make already-placed blocks jump to different spots.
 */
export default function TimerBoard({ progress, remainingMs }: { progress: number; remainingMs: number | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columns =
    size && size.width > 0 && size.height > 0
      ? Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, Math.round(size.width / TARGET_CELL)))
      : 0;
  const cell = columns ? size!.width / columns : 0;
  const rows = columns ? Math.max(1, Math.ceil(size!.height / cell)) : 0;
  const unit = cell / PITCH;

  const skyline = useMemo(() => (columns && rows ? buildSkyline(columns, rows) : null), [columns, rows]);
  const totalBlocks = skyline?.blocks.length ?? 0;

  const clamped = Math.min(1, Math.max(0, progress));
  const target = Math.min(totalBlocks, Math.floor(totalBlocks * clamped));

  // Latest target, read (not depended on) by the skyline-rebuild effect below - so a rebuild can
  // catch the board up to however much time has already elapsed without re-running every time
  // progress ticks forward.
  const targetRef = useRef(target);
  targetRef.current = target;

  // How many pieces have actually landed (rendered as plain static blocks - see below), and
  // which single index (if any) is currently mid-fall. Both reset whenever the board itself is
  // rebuilt (a real resize, or the first build after a reload) - jumping straight to the current
  // target rather than 0, since on a reload the countdown may already be well underway and the
  // board shouldn't visually re-flood from empty over whatever time is left.
  const [landed, setLanded] = useState(0);
  const [fallingAt, setFallingAt] = useState<number | null>(null);
  useEffect(() => {
    setLanded(targetRef.current);
    setFallingAt(null);
  }, [skyline]);

  // Behind schedule and nothing currently falling - drop the next one. Re-checked whenever
  // `progress` ticks forward or a piece finishes landing, so the queue keeps draining toward
  // `target` without ever having two pieces in the air together.
  useEffect(() => {
    if (fallingAt === null && landed < target) setFallingAt(landed);
  }, [fallingAt, landed, target]);

  // Whatever's left of the countdown, split across whatever blocks are still outstanding, so a
  // freshly-mounted FallingBlock always gets the true remaining share (not one fixed per-block
  // share baked in up front) - if earlier drops ever ran a touch behind, later ones automatically
  // speed up to close the gap, guaranteeing the board reaches fully flooded right as remainingMs
  // hits zero rather than trailing off after it.
  const remainingBlocks = totalBlocks - landed;
  const cycleMs =
    remainingMs && remainingBlocks > 0
      ? Math.max(MIN_LAND_PAUSE_MS / 2, remainingMs / remainingBlocks)
      : MIN_LAND_PAUSE_MS;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      {skyline &&
        skyline.blocks.slice(0, landed).map((piece) => {
          const box = placeBlock(piece, cell, unit);
          return (
            <LegoBlock
              key={`${piece.col}-${piece.bottom}-${piece.shape}`}
              shape={piece.shape}
              color={piece.color}
              className="absolute"
              style={box}
            />
          );
        })}
      {skyline && fallingAt !== null && (
        <FallingBlock
          key={fallingAt}
          piece={skyline.blocks[fallingAt]}
          cell={cell}
          unit={unit}
          rows={rows}
          cycleMs={cycleMs}
          onLanded={() => {
            setLanded((n) => n + 1);
            setFallingAt(null);
          }}
        />
      )}
    </div>
  );
}
