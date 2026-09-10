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
        className={`relative size-full origin-center bg-white shadow-md transition-transform duration-200 ease-out group-hover:scale-[1.6] ${
          active ? "scale-[1.6]" : ""
        }`}
      >
        <Image src={image} alt="" fill sizes={`${Math.ceil(width)}px`} className="object-cover" />
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center bg-gradient-to-t from-black/75 to-transparent px-1 pt-6 pb-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
            active ? "opacity-100" : ""
          }`}
        >
          <span className="font-nanum-pen text-center text-[13px] leading-tight text-white">{name}</span>
        </div>
      </div>
    </div>
  );
}

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

  return (
    <>
      {placed.map((venue) => {
        const active = activeImage === venue.image;
        return (
          <div
            key={venue.image}
            // `hover:z-20` rather than a group-hover further in: these wrappers are what paint
            // against each other, and at z-index auto they went in DOM order, so a hovered tile
            // kept getting covered by whichever venues happen to come after it in the roster.
            // The tapped one is lifted inline for the same reason.
            className="animate-lego-pop absolute hover:z-20"
            style={{
              left: venue.col * cell,
              bottom: venue.row * cell,
              width,
              height,
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
