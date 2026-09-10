"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { scatterPlacements } from "./scatter-placement";
import TetrisField from "./tetris-field";
import { VENUES } from "./venues";

// Figma node 337:386 ("Frame 74"), reproduced at its own 120x180 size and scaled to whatever the
// lego grid gives it - that frame is 2:3, which is exactly a 2-cell x 3-cell patch of the board.
const CARD_REF_WIDTH = 120;
const CARD_REF_HEIGHT = 180;

const SCHEDULE = [
  { day: "03", slot: 1 },
  { day: "04", slot: 1 },
  { day: "05", slot: 1 },
  { day: "06", slot: 1 },
  { day: "11", slot: 2 },
  { day: "12", slot: 2 },
  { day: "13", slot: 2 },
] as const;

/** One date card, laid out in the Figma frame's own coordinates and scaled as a whole. */
function DateCard({ slot, day, scale }: { slot: number; day: string; scale: number }) {
  return (
    <div
      style={{
        width: CARD_REF_WIDTH,
        height: CARD_REF_HEIGHT,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: `calc(50% - 30.27px)`,
          top: "8px",
          width: "43.469px",
          height: "30.921px",
          transform: "translateX(-50%)",
        }}
      >
        <p
          className="font-helvetica flex-none text-center lowercase"
          style={{
            width: "41px",
            transform: "rotate(-5.67deg)",
            fontSize: "19.078px",
            lineHeight: 1.4,
            letterSpacing: "-1.717px",
            color: "#242525",
            textDecoration: "underline wavy",
            textDecorationSkipInk: "none",
            textUnderlinePosition: "from-font",
          }}
        >
          slot {slot}
        </p>
      </div>

      <div className="absolute" style={{ left: "11px", top: "47px", width: "91px", height: "144px" }}>
        <p
          className="font-drowner absolute text-black"
          style={{ left: 0, right: 0, top: 0, fontSize: "50px", letterSpacing: "2px", lineHeight: "normal" }}
        >
          sep
        </p>
        <p
          className="font-drowner absolute text-black"
          style={{
            left: 0,
            top: "34px",
            width: "97px",
            height: "121px",
            fontSize: "100px",
            letterSpacing: "4px",
            lineHeight: "normal",
          }}
        >
          {day}
        </p>
      </div>
    </div>
  );
}

/**
 * The cards as patches of the lego board, scattered across it: each covers `cardCols` x `cardRows`
 * cells and leaves the same one-unit seam between neighbours that the studs do. Spots are drawn at
 * random and rejected if they'd overlap one already taken, so the dates land somewhere different
 * every time without ever sitting on top of each other.
 */
function DateCards({
  columns,
  rows,
  cell,
  unit,
  cardCols,
  cardRows,
}: {
  columns: number;
  rows: number;
  cell: number;
  unit: number;
  cardCols: number;
  cardRows: number;
}) {
  const placed = useMemo(
    () => scatterPlacements(SCHEDULE, { columns, rows, cardCols, cardRows }),
    [columns, rows, cardCols, cardRows]
  );

  const width = cardCols * cell - unit;

  return (
    <>
      {placed.map((card) => (
        <div
          key={card.day}
          className="animate-lego-pop absolute overflow-hidden bg-white"
          style={{
            left: card.col * cell,
            bottom: card.row * cell,
            width,
            height: cardRows * cell - unit,
          }}
        >
          <DateCard slot={card.slot} day={card.day} scale={width / CARD_REF_WIDTH} />
        </div>
      ))}
    </>
  );
}

/**
 * One venue tile: a real photo (unlike the date card's drawn type), so it gets next/image's
 * automatic resizing/format negotiation rather than a plain <img> - with 72 of these sitting in
 * public/venues, shipping them unoptimized would be the actual performance cost here. Sits at rest exactly filling its scattered cell patch; hovering scales the tile up
 * and fades in the name over it, both driven by the group so the whole patch is the hit target.
 */
function VenueCard({
  name,
  image,
  width,
  active,
  onActivate,
}: {
  name: string;
  image: string;
  width: number;
  active: boolean;
  onActivate: () => void;
}) {
  return (
    // `active` is the tap equivalent of the hover below - a touch device never fires :hover on
    // its own, and Tailwind's hover variants are gated behind (hover: hover), so without this the
    // tiles would be inert on a phone. Same JS-drives-tap, CSS-drives-hover split the creature
    // stickers use (see creature-swarm.tsx and globals.css).
    <div className="group absolute inset-0" onClick={onActivate}>
      {/* No z-index here: this div only stacks against its own wrapper, and the scaled tile has
          to beat the *other* tiles, which are that wrapper's siblings. The lift lives on the
          wrapper in VenueCards for that reason. */}
      <div
        // overflow-hidden keeps the name clipped to the photo: the label is sized in tile pixels
        // and then scaled up with everything else, so on a ~44px mobile tile a long venue name
        // was spilling out past the image. (The patch *around* the tile is still unclipped - see
        // VenueCards - so the pop itself can spill over its neighbours.)
        className={`relative size-full origin-center overflow-hidden bg-white shadow-md transition-transform duration-200 ease-out group-hover:scale-[2.1] lg:group-hover:scale-[1.8] ${
          active ? "scale-[2.1] lg:scale-[1.8]" : ""
        }`}
      >
        <Image src={image} alt="" fill sizes={`${Math.ceil(width)}px`} className="object-cover" />
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center bg-gradient-to-t from-black/75 to-transparent px-0.5 pt-3 pb-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 lg:px-1 lg:pt-5 lg:pb-1 ${
            active ? "opacity-100" : ""
          }`}
        >
          {/* Sized against the tile, not the screen - it rides the same scale as the photo, so
              what looks tiny at rest is what reads once popped. */}
          <span className="font-nanum-pen text-center text-[7px] leading-tight text-white lg:text-[11px]">
            {name}
          </span>
        </div>
      </div>
    </div>
  );
}

// How long the whole roster takes to land, rather than a per-tile delay: the roster grows every
// slot, and a fixed delay each would eventually run past the time the venue stage is held on
// screen for (VENUES_HOLD_MS in timer-section.tsx). Spreading a fixed window over however many
// venues there are keeps the cascade the same length whether there are 3 of them or 300.
const VENUE_POP_WINDOW_MS = 1800;

/**
 * The venue roster scattered the same way DateCards are (see scatterPlacements), but over its own
 * square footprint (see venueCardCols/Rows below) rather than the date card's 2:3 one - a photo
 * reads fine cropped square, and it keeps the tiles compact. Deliberately no overflow-hidden on
 * the outer patch (unlike DateCards): VenueCard's hover scale is meant to spill over its
 * neighbours, not get clipped to its own cell.
 */
function VenueCards({
  columns,
  rows,
  cell,
  unit,
  cardCols,
  cardRows,
}: {
  columns: number;
  rows: number;
  cell: number;
  unit: number;
  cardCols: number;
  cardRows: number;
}) {
  const placed = useMemo(
    () => scatterPlacements(VENUES, { columns, rows, cardCols, cardRows }),
    [columns, rows, cardCols, cardRows]
  );

  const width = cardCols * cell - unit;
  const height = cardRows * cell - unit;

  // Which tile a tap has popped. One at a time, so tapping another puts the last one back.
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const stagger = VENUE_POP_WINDOW_MS / Math.max(placed.length, 1);

  return (
    <>
      {placed.map((venue, index) => {
        const active = activeImage === venue.image;
        return (
          <div
            key={venue.image}
            // `hover:z-20` rather than a group-hover further in: these wrappers are what paint
            // against each other, and at z-index auto they went in DOM order, so a hovered tile
            // kept getting covered by whichever venues happen to come after it in the roster.
            // The tapped one is lifted inline for the same reason.
            className="animate-venue-shutter absolute hover:z-20"
            style={{
              left: venue.col * cell,
              bottom: venue.row * cell,
              width,
              height,
              // They land one after another rather than all at once, so the roster reads as
              // something filling up. lego-pop already runs `both`, so each tile holds its
              // scaled-down, transparent first frame until its turn comes round.
              animationDelay: `${Math.round(index * stagger)}ms`,
              ...(active ? { zIndex: 20 } : {}),
            }}
          >
            <VenueCard
              name={venue.name}
              image={venue.image}
              width={width}
              active={active}
              onActivate={() => setActiveImage(active ? null : venue.image)}
            />
          </div>
        );
      })}
    </>
  );
}

// The "know when?" reveal: fills the whole section with the tetris board's finished state - the
// exact same TetrisField the hero runs, rendered in its flooded end state (see the `flooded` prop)
// rather than reimplemented here - and then scatters either the event dates or the venue roster
// across it, depending on `stage`. The caller (TimerSection) drives the sequencing (board, then
// dates, then venues, then back to the section); this just renders a given step.
export default function CuriosityReveal({
  targetCell,
  cardCols,
  cardRows,
  venueCardCols,
  venueCardRows,
  stage,
}: {
  /** Passed straight through to TetrisField - the hero uses 68 on desktop and 22 on mobile. */
  targetCell: number;
  /** Date card footprint in cells. 2x3 matches the date card's Figma frame exactly; mobile scales
   *  both up together (keeping 2:3) so the cards stay legible against its much smaller cells. */
  cardCols: number;
  cardRows: number;
  /** Venue tile footprint in cells - square, independent of the date card's own footprint since a
   *  venue photo reads fine cropped square. The caller sizes this per breakpoint (a single cell on
   *  desktop's larger grid, 2x2 on mobile's much smaller one). */
  venueCardCols: number;
  venueCardRows: number;
  /** null keeps the board bare (mid-flood, before either set of cards has popped in). */
  stage: "dates" | "venues" | null;
}) {
  return (
    <div className="absolute inset-0 z-10 overflow-hidden">
      <TetrisField
        targetCell={targetCell}
        flooded
        overlay={
          stage
            ? (grid) =>
                stage === "dates" ? (
                  <DateCards {...grid} cardCols={cardCols} cardRows={cardRows} />
                ) : (
                  <VenueCards {...grid} cardCols={venueCardCols} cardRows={venueCardRows} />
                )
            : undefined
        }
      />
    </div>
  );
}
