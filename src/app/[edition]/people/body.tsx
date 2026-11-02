import { LEGO_COLORS, type LegoColor } from "@/app/lego-block";

// A little blocky body drawn under each cut-out head on the people page - neck, arms, hands, torso,
// legs, shoes - in the site's lego colours. Drawn from plain rectangles (crisp edges) so it sits
// with the tetris pieces and pixel creatures rather than looking like an illustration.
//
// Coordinates are in units of 1/100 of the head image's width, with (0, 0) at the head's neck
// point; the head is drawn on top, so the top of the neck tucks in under the chin.

export const BODY_POSES = ["down", "hips", "wave", "hooray"] as const;
export type BodyPose = (typeof BODY_POSES)[number];
// Two more, only for the find-the-brick game: hands closed together in front of the chest (could be
// hiding something), and the same hands opened flat (showing what is in them, or that it is empty).
export type GamePose = "hold" | "open";
// Where something held sits, in body units from the neck point: inside the closed fists (which are
// big enough to cover the brick completely), or in front of the open palms.
export const HANDS_AT = { hold: [0, 20], open: [0, 19] } as const;

// Shirts can be any lego colour; trousers skip cream (too pale against the white page).
export const SHIRT_COLORS = Object.keys(LEGO_COLORS) as LegoColor[];
export const PANTS_COLORS = SHIRT_COLORS.filter((c) => c !== "cream");

const SHOES = "#0e0e0d";
// The drawing's extent in those units: wide enough for elbows out, tall enough for a hand up.
const BOX = { x: -40, y: -42, w: 80, h: 140 };

type Block = [x: number, y: number, w: number, h: number, fill: string];

// One arm, for the image-right side; the left one is mirrored.
function arm(pose: BodyPose, up: boolean, sleeve: string, skin: string): Block[] {
  if (up) {
    // Out at the shoulder, then straight up beside the head, hand at the top.
    return [
      [20, 6, 10, 9, sleeve],
      [24, -26, 9, 41, sleeve],
      [24, -35, 9, 9, skin],
    ];
  }
  if (pose === "hips") {
    // Elbow out, forearm back in, hand on the hip.
    return [
      [20, 6, 12, 9, sleeve],
      [23, 15, 9, 15, sleeve],
      [18, 28, 9, 8, skin],
    ];
  }
  return [
    [20, 6, 9, 32, sleeve],
    [20, 38, 9, 8, skin],
  ];
}

const mirror = ([x, y, w, h, fill]: Block): Block => [-x - w, y, w, h, fill];

const CREASE = "rgba(0,0,0,0.3)";

// The arms for the game poses, the same whether the hands are open or closed: elbows down at the
// sides, bare forearms (skin, so they show against the shirt) in to the hands.
function gameArms(sleeve: string, skin: string): Block[] {
  const half: Block[] = [
    [20, 6, 9, 16, sleeve],
    [14, 16, 15, 7, skin],
  ];
  return [...half, ...half.map(mirror)];
}

// Just the hands, which is all that changes between the two game poses. Drawn big and chunky - a
// unit is only about a pixel on screen, so fine detail would just blur into a block - and as two
// clearly different outlines. Closed: two squat fists with a gap between them, curled fingers
// showing as horizontal creases and a thumb across the bottom, nothing sticking up; together wider
// and taller than the brick, so it is completely hidden. Open: two palms turned out with three fat
// fingers sticking up and spread (the shirt shows between them) and a thumb, like showing your hands.
function gameHands(pose: GamePose, skin: string): Block[] {
  const fist: Block[] = [
    [1, 13, 15, 14, skin],
    [5, 16.3, 11, 1.2, CREASE],
    [5, 19.6, 11, 1.2, CREASE],
    [1, 22.5, 10, 1.2, CREASE],
  ];
  const palm: Block[] = [
    [3, 15, 13, 10, skin],
    ...[3, 7.85, 12.7].map((x): Block => [x, 5.5, 3.3, 9.5, skin]),
    [0.5, 17.5, 3.5, 4, skin],
    [5, 21.5, 9, 1.2, CREASE],
  ];
  const hand = pose === "hold" ? fist : palm;
  return [...hand, ...hand.map(mirror)];
}

export default function Body({
  pose,
  shirt,
  pants,
  skin,
  size,
  neck,
  part,
}: {
  pose: BodyPose | GamePose;
  shirt: LegoColor;
  pants: LegoColor;
  skin: string;
  size: number; // px width of the head image
  neck: [number, number]; // the head's neck point, as fractions of the head image
  // Drawn in two layers around the head: the body behind it (so the neck tucks under the chin), and
  // the arms in front of it (so a raised hand shows over the hair rather than behind it).
  part: "body" | "arms";
}) {
  const sleeve = LEGO_COLORS[shirt];
  const game = pose === "hold" || pose === "open" ? pose : null;
  const everyday = game ? null : (pose as BodyPose);
  const blocks: Block[] =
    part === "arms"
      ? everyday
        ? [
            ...arm(everyday, everyday === "wave" || everyday === "hooray", sleeve, skin),
            ...arm(everyday, everyday === "hooray", sleeve, skin).map(mirror),
          ]
        : gameArms(sleeve, skin)
      : [
          // Neck (its top is hidden under the head).
          [-6, -12, 12, 20, skin],
          // Legs and shoes.
          [-17, 44, 15, 42, LEGO_COLORS[pants]],
          [2, 44, 15, 42, LEGO_COLORS[pants]],
          [-19, 86, 18, 8, SHOES],
          [1, 86, 18, 8, SHOES],
          // Torso.
          [-20, 4, 40, 42, sleeve],
        ];
  const unit = size / 100;
  return (
    <svg
      aria-hidden="true"
      viewBox={`${BOX.x} ${BOX.y} ${BOX.w} ${BOX.h}`}
      shapeRendering="crispEdges"
      // The box itself lets clicks through; the drawn blocks catch them, so tapping a body counts as
      // tapping that person (in the game, as much as tapping their head).
      className="pointer-events-none absolute [&_rect]:pointer-events-auto"
      style={{
        width: BOX.w * unit,
        height: BOX.h * unit,
        left: neck[0] * size + BOX.x * unit,
        top: neck[1] * size + BOX.y * unit,
      }}
    >
      {blocks.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
      {part === "arms" && game && (
        // Only the hands change in the game. Opening, they grow from their own centre and settle,
        // so it is easy to see whose hands just opened, even on a small figure.
        <g
          className={game === "open" ? "animate-hands-open" : "game-fists"}
          // Smoothed rather than crisp: on a small figure the finger creases are under a pixel wide,
          // and crisp edges would drop them entirely.
          shapeRendering="geometricPrecision"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          {gameHands(game, skin).map(([x, y, w, h, fill], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
          ))}
        </g>
      )}
    </svg>
  );
}
