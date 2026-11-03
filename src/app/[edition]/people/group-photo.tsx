"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { PEOPLE, type Person } from "../results/data";
import Body, { bodyBlocks, PANTS_COLORS, SHIRT_COLORS, type BodyPose } from "./body";
import { HEAD_FIT } from "./head-fit";
import { sfx, unlock } from "./sfx";
import { track, trackOnce, usePeopleTotal } from "./track";

// The end of the people page: a group photo. It starts with the thank-you and a button; press it
// and everyone from the page walks in from both sides - back rows first - and climbs onto a little
// set of steps, each row a step higher than the one in front and shifted half a place, so every
// face shows between the heads in front, the way group photos are always taken. The creatures of
// the site come too, each doing its own thing (the red one breathes fire, the brown one waves, the
// deer hops, the bug flies in and hovers), and the "Useless Projects 3.0" title from the home page
// hangs behind them. A 3-2-1 countdown, everyone cheers (and you hear it), the camera flashes, and
// the photo swings into a wooden frame hanging on a nail, with a little brass plaque. It stays hung
// there (in this browser) for the next visit; taking a new one replaces it. Each photo comes out
// different: who stands where, the shirts, who cheers and who waves. (No apostrophes in the
// comments here: Tailwind reads an unmatched one as the start of a string and silently skips the
// classes after it.)

const slug = (p: Person) => p.head?.split("/").pop()?.replace(/\.webp$/, "") ?? "";
// Everyone with a cut-out head (so they have a body to stand in).
const CAST = PEOPLE.filter((p) => HEAD_FIT[slug(p)]);

// The creatures of the site, each once (the creature-*.svg files are left out: they are still
// drawings of the green one, ele1, and the violet deer, ele5, which come here with their animations). `frames` play in a loop (one frame is a still creature
// that just bobs); `ratio` is the box width / height (the widest frame); `flies` keeps it in the air.
type Creature = { name: string; frames: string[]; ratio: number; frameMs?: number; flies?: boolean; photoFrame?: number };
const CREATURES: Creature[] = [
  { name: "green", frames: ["/ele1.webp"], ratio: 153 / 140 },
  { name: "fire", frames: ["/ele3a.webp", "/ele3b.webp", "/ele3c.webp", "/ele3d.webp", "/ele3c.webp", "/ele3b.webp"], ratio: 507 / 597, frameMs: 180, photoFrame: 2 }, // caught mid-breath in the photo
  // The brown one has wings (the green bits), so it flies, flapping them.
  { name: "flyer", frames: ["/ele4a.webp", "/ele4b.webp", "/ele4c.webp", "/ele4d.webp", "/ele4f.webp"], ratio: 313 / 318, frameMs: 140, flies: true },
  { name: "deer", frames: ["/ele5a.webp", "/ele5b.webp", "/ele5c.webp", "/ele5d.webp", "/ele5e.webp"], ratio: 548 / 474, frameMs: 320 },
  { name: "red crab", frames: ["/ele2.webp"], ratio: 1 },
];
const FLOOR_CREATURES = CREATURES.filter((c) => !c.flies);

const ARRIVAL_STEP_MS = 85; // between one person setting off and the next
const WALK_SPEED = 0.55; // px per ms - about a brisk stroll across the frame
const STEP_MS = 340; // one step of the walk (matches .animate-step in globals.css)
const BEAT_MS = 650; // each number of the countdown
const FLASH_MS = 700;
const FRAME_AFTER_MS = 1100; // from the flash to the photo swinging into its frame
const SAVED_KEY = "ulp-group-photo";
// The steps: blocks of earth with grass on top, in chunky pixels. Richer than pastel but a step
// softer than the creatures, so the bright creatures and shirts standing on them still stand out.
const GRASS = ["#5ccd77", "#5ccd77", "#72d68a", "#4abb66"];
const EARTH = "#c08f5f";
const EARTH_SPECKS = ["#ad7d4f", "#ad7d4f", "#cfa070", "#9e6f43"];
const PEBBLES = ["#FCFBB9", "#f3c49a", "#FCFBB9"]; // a few pebbles in the site cream and a soft orange
// Where the shoes end, in head widths below the neck point (see the body drawing in body.tsx).
const FEET_BELOW_NECK = 0.94;

type Phase = "idle" | "gathering" | "countdown" | "flash" | "framed";
type Shot = { seed: number; at: number };
// How someone (or something) gets to their place: from where, when they set off, how long it takes.
type Walk = { fromX: number; delay: number; duration: number };
type Spot = {
  person: Person;
  left: number;
  top: number;
  size: number;
  row: number;
  tilt: number;
  walk: Walk;
  cheer: BodyPose;
  shirt: (typeof SHIRT_COLORS)[number];
  pants: (typeof PANTS_COLORS)[number];
};

// A small seeded random, so the same seed always gives the same photo.
function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Walking in from whichever side is nearer, starting just out of the frame.
function walkFrom(left: number, w: number, width: number, delay: number): Walk {
  const fromLeft = left + w / 2 < width / 2;
  const fromX = fromLeft ? -(left + w + 24) : width - left + 24;
  return { fromX, delay, duration: Math.max(900, Math.abs(fromX) / WALK_SPEED) };
}

// The steps: rows from the back, each standing a step higher than the one in front and shifted
// half a place, so faces show in the gaps. Everyone is about the same size (the back rows a touch
// smaller, being further away); the front row stands on the floor at the bottom of the frame, the
// creatures sit on the floor in front of them, and the bug hovers up by the title.
function layout(width: number, height: number, seed: number, narrow: boolean) {
  const rand = seeded(seed);
  const rows = narrow ? 5 : 3;
  const counts = Array.from({ length: rows }, () => Math.floor(CAST.length / rows));
  for (let r = rows - 1, left = CAST.length - counts.reduce((a, b) => a + b, 0); left > 0; r--, left--) counts[r]++;
  const widest = Math.max(...counts);
  // A touch bigger than the room per person, so neighbours just overlap - a crowd, not a line-up.
  const size = Math.min(width / (widest * (narrow ? 0.74 : 0.8)), height * 0.25);
  const riser = size * 0.58;
  const floor = height * 0.985;
  const shuffled = CAST.map((p) => ({ p, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.p);
  let next = 0;
  let order = 0; // back rows set off first, so they are up the steps before the front fills in
  const spots = counts.flatMap((count, row) => {
    const rowSize = size * (0.9 + 0.1 * (row / (rows - 1)));
    const stepFloor = floor - (rows - 1 - row) * riser;
    const span = width * 0.96;
    const shift = (row % 2 ? 0.25 : -0.25) * (span / count) + (rand() - 0.5) * rowSize * 0.2;
    return Array.from({ length: count }, (_, c) => {
      const person = shuffled[next++];
      const fit = HEAD_FIT[slug(person)];
      // Everyone a little off their slot, a little taller or shorter, leaning their own way.
      const s = rowSize * (0.92 + rand() * 0.16);
      const centre = (width - span) / 2 + ((c + 0.5) / count) * span + shift + (rand() - 0.5) * s * 0.25;
      const shirt = SHIRT_COLORS[Math.floor(rand() * SHIRT_COLORS.length)];
      const pantsChoices = PANTS_COLORS.filter((p) => p !== shirt);
      const left = centre - s / 2;
      return {
        person,
        row,
        size: s,
        left,
        // Feet on this step: the shoes sit FEET_BELOW_NECK under the neck point of the head image.
        top: stepFloor - (fit.neck[1] + FEET_BELOW_NECK) * s - (rand() - 0.3) * s * 0.1,
        tilt: (rand() - 0.5) * 8,
        walk: walkFrom(left, s, width, order++ * ARRIVAL_STEP_MS + rand() * 60),
        cheer: (rand() < 0.65 ? "hooray" : "wave") as BodyPose,
        shirt,
        pants: pantsChoices[Math.floor(rand() * pantsChoices.length)],
      } satisfies Spot;
    });
  });
  const steps = Array.from({ length: rows }, (_, row) => floor - (rows - 1 - row) * riser);
  // The creatures on the floor, in front of everyone, each a little different in size.
  const crew = FLOOR_CREATURES.map((c) => ({ c, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map(({ c }, i, all) => {
      const h = size * (narrow ? 0.66 : 0.74) * (0.88 + rand() * 0.24);
      const w = h * c.ratio;
      const centre = width * (0.07 + (0.86 * (i + 0.5)) / all.length) + (rand() - 0.5) * size * 0.25;
      const left = centre - w / 2;
      return { c, w, h, left, top: height - h * 0.94, walk: walkFrom(left, w, width, (CAST.length + i) * ARRIVAL_STEP_MS) };
    });
  // The flyer, up by the top corner, clear of the title, flapping its wings.
  const flyer = CREATURES.filter((c) => c.flies).map((c) => {
    const h = size * (narrow ? 0.7 : 0.8);
    return { c, w: h * c.ratio, h, left: width * (rand() < 0.5 ? 0.06 : 0.82), top: height * (narrow ? 0.3 : 0.2), delay: CAST.length * ARRIVAL_STEP_MS * 0.5 };
  });
  const lastIn = Math.max(...spots.map((s) => s.walk.delay + s.walk.duration), ...crew.map((c) => c.walk.delay + c.walk.duration));
  return { spots, steps, crew, flyer, frontZ: 2 + rows * 2, lastIn };
}

// A creature playing its frames in a loop (all frames stay loaded and just swap visibility, so
// nothing flickers while a frame loads).
function Frames({ frames, ms = 300, still, eager }: { frames: string[]; ms?: number; still?: number; eager?: boolean }) {
  const [playing, setShown] = useState(0);
  // Once the photo is taken it is a still: the creature holds one frame.
  const shown = still ?? playing;
  useEffect(() => {
    if (frames.length < 2 || still !== undefined) return;
    const id = setInterval(() => setShown((i) => (i + 1) % frames.length), ms);
    return () => clearInterval(id);
  }, [frames, ms, still]);
  // A still only needs its one frame; while playing, every frame stays loaded so swaps never flicker.
  const drawn = still === undefined ? frames : [frames[still]];
  return (
    <>
      {drawn.map((src, i) => (
        <Image
          key={`${src}-${i}`}
          src={src}
          alt=""
          fill
          loading={eager ? "eager" : "lazy"}
          // Pixel art: the original file, drawn with hard pixel edges (resizing and smoothing blur it).
          unoptimized
          className="object-contain object-bottom [image-rendering:pixelated]"
          style={{ opacity: still !== undefined || i === shown ? 1 : 0 }}
        />
      ))}
    </>
  );
}

// The walk: the outer box slides in from its side, the inner one steps (a bob and a little sway)
// for as long as the walk lasts, then stands still.
function walkStyle(walk: Walk, walking: boolean): React.CSSProperties {
  if (!walking) return {};
  return {
    animationDelay: `${walk.delay}ms`,
    ["--from-x" as string]: `${walk.fromX}px`,
    ["--walk" as string]: `${walk.duration}ms`,
  };
}
function stepStyle(walk: Walk, walking: boolean): React.CSSProperties {
  if (!walking) return {};
  return { animationDelay: `${walk.delay}ms`, ["--steps" as string]: `${Math.max(2, Math.round(walk.duration / STEP_MS))}` };
}

// One step: a block of warm brown earth with a band of grass on top, drawn in chunky square pixels.
// Not a copy of any game block - the grass is the lego green of the site and grows a few tufts above
// the edge, it hangs down unevenly into the earth, and the earth has a scatter of darker specks and
// the odd cream or orange pebble. Only the part not hidden by the step in front (`shows`) is
// detailed; below that it is plain earth.
// Paints one step onto a canvas: earth from `top` down, the grass band, specks and pebbles, and the
// tufts one pixel above the edge. Shared by the step on screen and the photo download, so both match.
function paintStep(paint: CanvasRenderingContext2D, top: number, shows: number, width: number, height: number, pixel: number, seed: number) {
  const rand = seeded(seed);
  const cols = Math.ceil(width / pixel);
  const rows = Math.ceil(shows / pixel);
  paint.fillStyle = EARTH;
  paint.fillRect(0, top, width, height - top);
  for (let c = 0; c < cols; c++) {
    const cell = (r: number, fill: string) => {
      paint.fillStyle = fill;
      paint.fillRect(Math.floor(c * pixel), Math.floor(top + r * pixel), Math.ceil(pixel), Math.ceil(pixel));
    };
    // Grass: two rows, hanging a little further down here and there, with the odd tuft on top.
    const depth = 2 + (rand() < 0.35 ? 1 : 0) + (rand() < 0.12 ? 1 : 0);
    if (rand() < 0.18) cell(-1, GRASS[0]);
    for (let r = 0; r < Math.min(depth, rows); r++) cell(r, GRASS[Math.floor(rand() * GRASS.length)]);
    for (let r = depth; r < rows; r++) {
      const roll = rand();
      if (roll < 0.03) cell(r, PEBBLES[Math.floor(rand() * PEBBLES.length)]);
      else if (roll < 0.2) cell(r, EARTH_SPECKS[Math.floor(rand() * EARTH_SPECKS.length)]);
    }
  }
}

function GrassStep({
  top,
  shows,
  width,
  height,
  pixel,
  seed,
  zIndex,
}: {
  top: number;
  shows: number;
  width: number;
  height: number;
  pixel: number;
  seed: number;
  zIndex: number;
}) {
  // Painted once into a single image (not hundreds of separate squares), so the page stays light.
  // Twice the size for sharp edges on high-density screens; it starts a pixel above the step for
  // the tufts.
  const tall = height - top + pixel;
  const src = useMemo(() => {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(tall * scale);
    const paint = canvas.getContext("2d");
    if (paint) {
      paint.scale(scale, scale);
      paintStep(paint, pixel, shows, width, tall, pixel, seed);
    }
    return canvas.toDataURL("image/png");
  }, [tall, shows, width, pixel, seed]);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a picture painted in the browser, not a file
    <img aria-hidden="true" alt="" src={src} className="absolute left-0 max-w-none" style={{ top: top - pixel, width, height: tall, zIndex }} />
  );
}

const stepPixel = (steps: number[], height: number) => Math.max(4, ((steps[1] ?? height) - steps[0]) / 7);
// The title, sized off the width of the frame (see Scene and paintPhoto).
const titleType = (width: number, narrow: boolean) => width * (narrow ? 0.13 : 0.085);
const titleTop = (type: number, narrow: boolean) => type * (narrow ? 1.5 : 1.1);

// The scene itself: the title, the steps, everyone on them and the creatures.
function Scene({
  width,
  height,
  seed,
  pose,
  walking,
  shown,
  still,
}: {
  width: number;
  height: number;
  seed: number;
  pose: "standing" | "cheering";
  walking: boolean;
  shown: boolean;
  still: boolean; // the photo has been taken: nothing moves
}) {
  if (!width) return null;
  const narrow = width < 640;
  const { spots, steps, crew, flyer, frontZ } = layout(width, height, seed, narrow);
  // The home page title: "Useless / Projects" on two lines, with "3.0" floating above to the right.
  const type = titleType(width, narrow);
  return (
    <>
      <div aria-hidden="true" className={`absolute inset-x-0 flex justify-center transition-opacity duration-700 ${shown ? "opacity-100" : "opacity-0"}`} style={{ top: titleTop(type, narrow) }}>
        <div className="relative">
          <p className="font-drowner text-center leading-[0.836] tracking-[0.02em] text-[#0e0e0d]" style={{ fontSize: type }}>
            <span className="block">Useless</span>
            <span className="block">Projects</span>
          </p>
          <span className={`font-jrk absolute leading-none text-[#0e0e0d] ${still ? "" : "animate-float-slow"}`} style={{ fontSize: type * 0.95, top: -type * 0.75, right: -type * 0.42 }}>
            3.0
          </span>
        </div>
      </div>
      {shown &&
        steps.map((top, row) => (
          <GrassStep
            key={row}
            top={top}
            shows={(steps[row + 1] ?? height) - top}
            width={width}
            height={height}
            pixel={stepPixel(steps, height)}
            seed={seed + row * 977}
            zIndex={1 + row * 2}
          />
        ))}
      {shown &&
        spots.map((spot, i) => {
          const fit = HEAD_FIT[slug(spot.person)];
          const bodyPose: BodyPose = pose === "cheering" ? spot.cheer : i % 3 ? "down" : "hips";
          return (
            <div
              key={`${spot.person.head}-${i}`}
              // The hover z-index is marked important so it beats the row stacking set inline below,
              // keeping the name over the row in front.
              className={`group absolute hover:z-50! ${walking ? "animate-walk-in" : ""}`}
              style={{ left: spot.left, top: spot.top, width: spot.size, height: spot.size, zIndex: 2 + spot.row * 2 + (i % 2), ...walkStyle(spot.walk, walking) }}
            >
              <div className={`relative size-full ${walking ? "animate-step" : ""}`} style={{ rotate: `${spot.tilt}deg`, ...stepStyle(spot.walk, walking) }}>
                <Body part="body" pose={bodyPose} shirt={spot.shirt} pants={spot.pants} skin={fit.skin} size={spot.size} neck={fit.neck} />
                {/* Loaded straight away while walking in: they start out of view, so lazy loading would walk
                    them in headless. */}
                <Image src={spot.person.head!} alt="" fill loading={walking ? "eager" : "lazy"} unoptimized className="object-contain" />
                <Body part="arms" pose={bodyPose} shirt={spot.shirt} pants={spot.pants} skin={fit.skin} size={spot.size} neck={fit.neck} />
              </div>
              {/* The name, shown over the head while hovered (not while they are still walking in). */}
              {!walking && spot.person.name !== "volunteer" && (
                <span className="font-nanum-pen pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0e0e0d] px-2 py-0.5 text-[14px] leading-none text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:text-[16px]">
                  {spot.person.name}
                </span>
              )}
            </div>
          );
        })}
      {shown &&
        crew.map(({ c, w, h, left, top, walk }, i) => (
          <div
            key={c.name}
            aria-hidden="true"
            className={`absolute ${walking ? "animate-walk-in" : ""}`}
            style={{ left, top, width: w, height: h, zIndex: frontZ, ...walkStyle(walk, walking) }}
          >
            {/* Hopping along on the way in, then a gentle bob of its own once it has arrived. */}
            <div
              className={`relative size-full ${walking ? "animate-step" : still ? "" : "animate-idle-bob"}`}
              style={walking ? stepStyle(walk, walking) : { animationDelay: `${-i * 0.37}s` }}
            >
              <Frames frames={c.frames} ms={c.frameMs} still={still ? (c.photoFrame ?? 0) : undefined} eager={walking} />
            </div>
          </div>
        ))}
      {shown &&
        flyer.map(({ c, w, h, left, top, delay }) => (
          // The bug flies in from above and keeps hovering about.
          <div
            key={c.name}
            aria-hidden="true"
            className={`absolute ${walking ? "animate-fly-in" : ""}`}
            style={{ left, top, width: w, height: h, zIndex: frontZ, animationDelay: walking ? `${delay}ms` : undefined }}
          >
            <div className={`relative size-full ${still ? "" : "animate-hover-fly"}`}>
              <Frames frames={c.frames} ms={c.frameMs} still={still ? (c.photoFrame ?? 0) : undefined} eager={walking} />
            </div>
          </div>
        ))}
    </>
  );
}

// The photo as a picture file: the same layout as the one on screen (same seed, same proportions, so
// the same people in the same places), painted at full resolution - landscape, or portrait for
// whoever is looking at the portrait version on a phone - inside the same wooden frame and mat.
const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

async function paintPhoto(seed: number, narrow: boolean, fonts: { title: string; badge: string }) {
  const width = narrow ? 1200 : 1920;
  const height = narrow ? 1600 : 1080;
  const { spots, steps, crew, flyer, frontZ } = layout(width, height, seed, narrow);
  const border = Math.round(width * 0.03);
  const mat = Math.round(width * 0.032);
  const edge = border + mat;
  const canvas = document.createElement("canvas");
  canvas.width = width + edge * 2;
  canvas.height = height + edge * 2;
  const paint = canvas.getContext("2d");
  if (!paint) throw new Error("No canvas");

  // The frame, the mat, and the white of the photo.
  const wood = paint.createLinearGradient(0, 0, canvas.width, canvas.height);
  wood.addColorStop(0, "#8e5a2e");
  wood.addColorStop(0.4, "#6a3f1d");
  wood.addColorStop(0.6, "#9b6534");
  wood.addColorStop(1, "#5e3818");
  paint.fillStyle = wood;
  paint.fillRect(0, 0, canvas.width, canvas.height);
  paint.fillStyle = "#fbf8ef";
  paint.fillRect(border, border, width + mat * 2, height + mat * 2);
  paint.translate(edge, edge);
  paint.fillStyle = "#ffffff";
  paint.fillRect(0, 0, width, height);
  paint.beginPath();
  paint.rect(0, 0, width, height);
  paint.clip();

  // The title, with "3.0" up to its right.
  const type = titleType(width, narrow);
  const top = titleTop(type, narrow);
  await Promise.all([document.fonts.load(`${type}px ${fonts.title}`), document.fonts.load(`${type}px ${fonts.badge}`)]);
  paint.fillStyle = "#0e0e0d";
  paint.textAlign = "center";
  paint.textBaseline = "middle";
  paint.font = `${type}px ${fonts.title}`;
  (paint as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${type * 0.02}px`;
  const lines = ["Useless", "Projects"];
  const blockWidth = Math.max(...lines.map((l) => paint.measureText(l).width));
  lines.forEach((line, i) => paint.fillText(line, width / 2, top + type * 0.836 * (i + 0.5)));
  (paint as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
  paint.font = `${type * 0.95}px ${fonts.badge}`;
  paint.textAlign = "right";
  paint.fillText("3.0", width / 2 + blockWidth / 2 + type * 0.42, top - type * 0.75 + type * 0.95 * 0.5);

  // Everything else, back to front in the same order as on screen.
  const heads = await Promise.all(spots.map((spot) => loadImage(spot.person.head!)));
  const creatures = await Promise.all([...crew, ...flyer].map(({ c }) => loadImage(c.frames[c.photoFrame ?? 0])));
  type Layer = { z: number; draw: () => void };
  const layers: Layer[] = [];
  const pixel = stepPixel(steps, height);
  steps.forEach((stepTop, row) =>
    layers.push({ z: 1 + row * 2, draw: () => paintStep(paint, stepTop, (steps[row + 1] ?? height) - stepTop, width, height, pixel, seed + row * 977) }),
  );
  spots.forEach((spot, i) =>
    layers.push({
      z: 2 + spot.row * 2 + (i % 2),
      draw: () => {
        const fit = HEAD_FIT[slug(spot.person)];
        const unit = spot.size / 100;
        const [nx, ny] = [fit.neck[0] * spot.size, fit.neck[1] * spot.size];
        paint.save();
        paint.translate(spot.left + spot.size / 2, spot.top + spot.size / 2);
        paint.rotate((spot.tilt * Math.PI) / 180);
        paint.translate(-spot.size / 2, -spot.size / 2);
        const blocks = (part: "body" | "arms") =>
          bodyBlocks(part, spot.cheer, spot.shirt, spot.pants, fit.skin).forEach(([x, y, w, h, fill]) => {
            paint.fillStyle = fill;
            paint.fillRect(nx + x * unit, ny + y * unit, w * unit, h * unit);
          });
        blocks("body");
        paint.drawImage(heads[i], 0, 0, spot.size, spot.size);
        blocks("arms");
        paint.restore();
      },
    }),
  );
  [...crew, ...flyer].forEach(({ w, h, left, top: y }, i) =>
    layers.push({
      z: frontZ,
      draw: () => {
        // Fitted into its box like on screen: whole, centred, standing on the bottom edge.
        const img = creatures[i];
        const fit = Math.min(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * fit;
        const dh = img.naturalHeight * fit;
        paint.imageSmoothingEnabled = false;
        paint.drawImage(img, left + (w - dw) / 2, y + h - dh, dw, dh);
        paint.imageSmoothingEnabled = true;
      },
    }),
  );
  layers.map((layer, order) => ({ ...layer, order })).sort((a, b) => a.z - b.z || a.order - b.order).forEach((layer) => layer.draw());

  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No image"))), "image/png"));
}

function loadShot(): Shot | null {
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    const shot = raw ? (JSON.parse(raw) as Shot) : null;
    return shot && typeof shot.seed === "number" ? shot : null;
  } catch {
    return null;
  }
}

function saveShot(shot: Shot) {
  try {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(shot));
  } catch {
    // Private windows and full storage: the photo just stays up until the page is closed.
  }
}

export default function GroupPhoto({ title, thanks }: { title: string; thanks: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [phase, setPhase] = useState<Phase>("idle");
  const [beat, setBeat] = useState(0);
  const [flash, setFlash] = useState(0);
  // How many group photos everyone has taken and saved, shown under the frame.
  const taken = usePeopleTotal("photo-taken");
  const saved = usePeopleTotal("photo-saved");
  const [seed, setSeed] = useState(1);
  const [kept, setKept] = useState<Shot | null>(null);
  const [justHung, setJustHung] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setBox({ width: stage.clientWidth, height: stage.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);
  // The kept photo lives in this browser; read it once on arrival.
  useEffect(() => {
    const shot = loadShot();
    if (!shot) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage only exists after mount
    setKept(shot);
    setSeed(shot.seed);
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  function shoot() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    unlock();
    sfx.start();
    const shotSeed = Math.floor(Math.random() * 2 ** 31);
    setSeed(shotSeed);
    setJustHung(false);
    setPhase("gathering");
    setBeat(0);
    // Wait for the last one to get to their place (the live frame is the larger one, before framing).
    const stage = stageRef.current;
    const width = stage?.clientWidth ?? 1000;
    const { lastIn } = layout(width, stage?.clientHeight ?? 600, shotSeed, width < 640);
    const gathered = lastIn + 400;
    later(gathered, () => setPhase("countdown"));
    [3, 2, 1].forEach((n, i) =>
      later(gathered + i * BEAT_MS, () => {
        setBeat(n);
        sfx.tick();
      }),
    );
    const snap = gathered + 3 * BEAT_MS;
    later(snap, () => {
      setFlash((f) => f + 1);
      sfx.shutter();
      sfx.cheer();
      setPhase("flash");
    });
    // Then it is framed and hung up, replacing whatever photo was there before.
    later(snap + FRAME_AFTER_MS, () => {
      const shot = { seed: shotSeed, at: Date.now() };
      saveShot(shot);
      track("photo-taken");
      trackOnce("photo-taker");
      setKept(shot);
      setJustHung(true);
      setPhase("framed");
      later(450, sfx.clack);
    });
  }

  // Saves the framed photo as a PNG, painted fresh at full resolution in the shape it is shown here:
  // landscape on a wide screen, portrait on a phone.
  async function download() {
    const stage = stageRef.current;
    if (!stage || !kept || saving) return;
    setSaving(true);
    try {
      const fontOf = (selector: string) => getComputedStyle(stage.querySelector(selector) ?? stage).fontFamily;
      const narrow = stage.clientWidth < 640;
      const blob = await paintPhoto(kept.seed, narrow, { title: fontOf(".font-drowner"), badge: fontOf(".font-jrk") });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `useless-projects-3.0-group-photo-${narrow ? "portrait" : "landscape"}.png`;
      link.click();
      track("photo-saved");
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } finally {
      setSaving(false);
    }
  }

  const live = phase === "gathering" || phase === "countdown" || phase === "flash";
  // Framed: just taken, or one kept from an earlier visit.
  const framed = phase === "framed" || (phase === "idle" && kept !== null);
  const cheering = (phase === "countdown" && beat === 1) || phase === "flash" || framed;

  return (
    <div className="flex w-full flex-col items-center">
      {framed && <p className="font-nanum-pen mb-16 text-[24px] leading-none text-[#244638] md:mb-24 md:text-[32px]">{title}</p>}

      {/* The photo. Live, it fills the width; framed, it hangs on a nail in a wooden frame. */}
      <div
        className={`relative ${framed ? "w-[min(900px,calc(100vw-40px))]" : "w-[min(1100px,calc(100vw-32px))]"} ${framed && justHung ? "animate-frame-hang" : ""}`}
        style={{ transformOrigin: "50% -60px" }}
      >
        {framed && (
          // The nail and the string the frame hangs from.
          <svg aria-hidden="true" className="absolute inset-x-0 -top-14 h-16 w-full md:-top-20 md:h-[88px]" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M18 20 L50 2 L82 20" fill="none" stroke="#6b4a2b" vectorEffect="non-scaling-stroke" strokeWidth={2} />
          </svg>
        )}
        {framed && <span aria-hidden="true" className="absolute -top-16 left-1/2 z-10 size-3.5 -translate-x-1/2 rounded-full bg-[#8a8a8a] shadow-[0_2px_3px_rgba(0,0,0,0.4)] md:-top-[86px] md:size-4" />}

        <div
          className={
            framed
              ? "border-[10px] border-[#7a4a24] bg-[#fbf8ef] p-3 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.25),0_20px_40px_rgba(0,0,0,0.25)] md:border-[18px] md:p-6"
              : ""
          }
          style={framed ? { borderImage: "linear-gradient(135deg, #8e5a2e, #6a3f1d 40%, #9b6534 60%, #5e3818) 1" } : undefined}
        >
          <div ref={stageRef} className={`relative aspect-[3/4] w-full overflow-hidden bg-white sm:aspect-video ${framed ? "shadow-[inset_0_0_10px_rgba(0,0,0,0.15)]" : ""}`}>
            <Scene
              key={`scene-${seed}`}
              width={box.width}
              height={box.height}
              seed={seed}
              pose={cheering ? "cheering" : "standing"}
              walking={phase === "gathering" || phase === "countdown"}
              shown={live || framed}
              still={framed}
            />

            {/* Before any photo: the thank-you and the button. */}
            {phase === "idle" && !kept && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 px-4 text-center md:gap-8">
                <h3 className="font-drowner leading-[0.95]" style={{ fontSize: "clamp(30px, 4.4vw, 56px)" }}>
                  {title}
                </h3>
                <p className="font-drowner leading-[0.9]" style={{ fontSize: "clamp(48px, 8vw, 120px)" }}>
                  {thanks}
                </p>
                <button
                  type="button"
                  onClick={shoot}
                  className="font-drowner mt-2 flex cursor-pointer items-center gap-3 bg-[#0e0e0d] px-5 py-3 text-[24px] text-white shadow-md transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.04] active:scale-[0.97] md:px-7 md:py-4 md:text-[30px]"
                >
                  <CameraIcon />
                  take a group photo
                </button>
              </div>
            )}

            {/* The countdown. */}
            {phase === "countdown" && beat > 0 && (
              <span
                key={`beat-${beat}`}
                aria-live="polite"
                className="font-drowner animate-sticker-pop absolute inset-x-0 top-1/2 z-40 -translate-y-1/2 text-center leading-none text-[#0e0e0d]"
                style={{ fontSize: "clamp(120px, 22vw, 260px)", WebkitTextStroke: "10px #fff", paintOrder: "stroke fill" }}
              >
                {beat}
              </span>
            )}

            {/* The flash. */}
            {flash > 0 && live && (
              <span key={`flash-${flash}`} aria-hidden="true" className="animate-camera-flash pointer-events-none absolute inset-0 z-50 bg-white" style={{ animationDuration: `${FLASH_MS}ms` }} />
            )}
          </div>
        </div>

        {framed && kept && (
          // A little card taped under the frame, in the same hand as the note, and a button to take a
          // new photo in its place.
          <div className="mt-6 flex items-center justify-center gap-4 md:mt-8">
            <p className="relative -rotate-2 border border-[#0e0e0d]/[0.06] bg-white px-5 pt-3 pb-2 text-center shadow-[0_6px_16px_rgba(0,0,0,0.12)] md:px-7">
              <span aria-hidden="true" className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rotate-3 bg-[#0e0e0d]/[0.07]" />
              <span className="font-nanum-pen block text-[24px] leading-none font-bold text-[#244638] md:text-[30px]">{thanks}</span>
              <span className="font-nanum-pen block pt-1 text-[16px] leading-none text-[#244638]/70 md:text-[19px]">
                {new Date(kept.at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </p>
            <button
              type="button"
              onClick={download}
              disabled={saving}
              aria-label="Download the photo"
              title="Download"
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center bg-[#0e0e0d] text-white transition-transform hover:scale-110 disabled:cursor-wait disabled:opacity-60 md:size-12"
            >
              <DownloadIcon />
            </button>
            <button
              type="button"
              onClick={shoot}
              aria-label="Take a new group photo"
              title="Take a new one"
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center bg-[#0e0e0d] text-white transition-transform hover:scale-110 md:size-12"
            >
              <CameraIcon />
            </button>
          </div>
        )}
        {!live && taken !== null && taken > 0 && (
          <p className="font-nanum-pen mt-4 text-center text-[18px] leading-none text-[#244638]/80 md:mt-5 md:text-[22px]">
            group photo taken {taken.toLocaleString("en-IN")} {taken === 1 ? "time" : "times"}
            {saved !== null && saved > 0 && <>, {saved.toLocaleString("en-IN")} saved</>}
          </p>
        )}
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 md:size-7" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="square" aria-hidden="true">
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 md:size-7" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8h4l2-3h6l2 3h4v11H3z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
