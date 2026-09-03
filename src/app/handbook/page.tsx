import type { Metadata } from "next";
import Link from "next/link";
import InstagramEmbed from "./instagram-embed";
import ChecklistWidget from "./checklist";
import HoverFrames from "./hover-frames";
import LegoBlock, { CELL, LEGO_SHAPES, shapeWidth, shapeHeight, type LegoColor, type LegoShapeName } from "../lego-block";
import { HoverDot } from "../hover-dot";

// Same brick colors the tetris field drops, minus cream (too low-contrast on white here). Cycled
// by index so studs/bullets read as a deliberate little rainbow rather than one flat accent color.
const STUD_COLORS: LegoColor[] = ["magenta", "cyan", "green", "orange", "purple", "red"];
// The five actual tetromino pieces (not the bare single-cell "stud") - multi-block shapes so a
// step marker reads as a little built thing, not just a colored dot.
const STEP_SHAPES: LegoShapeName[] = ["ess", "brick", "line", "square", "tee"];
// Same palette the hero's corner dots use, reused here rather than minting new assets - the
// "breathing" circle badge from the homepage.
const DOT_ASSETS = ["/why-dot.svg", "/hero-dot-1.svg", "/hero-dot-2.svg", "/hero-dot-3.svg", "/hero-dot-4.svg"] as const;

// Sizes a shape by cell size, not by a fixed bounding-box height. The five step shapes have
// different row/col counts (line is 1x3, ess/brick are 3x2), so stretching every shape to the
// same height would scale their individual cells inconsistently - a 3-row shape's studs would
// end up visibly smaller than a 1-row shape's. Holding cellPx constant instead means a stud is
// the same physical size in every shape; only the overall footprint varies, which is correct.
function legoStyle(shape: LegoShapeName, cellPx: number): React.CSSProperties {
  const { rows } = LEGO_SHAPES[shape];
  const scale = cellPx / CELL;
  return { width: shapeWidth(rows) * scale, height: shapeHeight(rows) * scale };
}

export const metadata: Metadata = {
  title: "Handbook · Useless Projects",
  description: "Rules, how to participate, and everything else worth knowing before you build something you actually want to make.",
};

// PLACEHOLDER COPY. The structure below is the point - every string here is sample text meant to
// be swapped for the real handbook. Sections render straight off this array, so adding, dropping
// or reordering one is a data edit; nothing in the layout is keyed to a particular section.
type Block =
  | { kind: "text"; text: string }
  | { kind: "subheading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "steps"; items: { title: string; text: React.ReactNode; href?: string; linkLabel?: string }[] }
  | { kind: "note"; text: string }
  | { kind: "links"; items: { label: string; href: string; text: string; tag?: string }[] }
  | { kind: "cards"; items: { tag?: string; title: string; text: string; image?: string }[] }
  | { kind: "gallery"; items: { title: string; text: string; image?: string }[] }
  | { kind: "embeds"; items: { title: string; permalink: string }[] }
  | { kind: "video"; youtubeId: string; title: string }
  | { kind: "prizes"; items: { label: string; text?: string; locked?: boolean; image?: string; imageScale?: number; slug?: string }[]; size?: "sm" | "lg" }
  | { kind: "creatures"; items: { label: string; image: string; hoverFrames?: string[] }[] };

type Section = {
  id: string;
  nav: string;
  title: string;
  lead: string;
  blocks: Block[];
};

const SECTIONS: Section[] = [
  {
    id: "readme",
    nav: "start here",
    title: "start here",
    lead: "Useless Projects is a build sprint about making something purely because you want to, not because it solves anything.",
    blocks: [
      {
        kind: "video",
        youtubeId: "Q59AWr_RRiA",
        title: "why useless projects",
      },
      {
        kind: "note",
        text: "New here? Read this page top to bottom once. It covers everything you need before and during the hackathon.",
      },
    ],
  },
  {
    id: "participate",
    nav: "how to join",
    title: "how to participate",
    lead: "Registration is a single application, open to any student from a TinkerHub campus.",
    blocks: [
      {
        kind: "steps",
        items: [
          {
            title: "Apply on the hub app",
            text: "Registration is through useless.tinkerhub.org, which opens the TinkerHub hub app. Any student from a TinkerHub campus can apply.",
            href: "https://www.instagram.com/p/DMctgGIvWaN/",
            linkLabel: "guide: how to register for Useless Projects",
          },
          {
            title: "Prepare before the day",
            text: "Once accepted, start thinking through and preparing your project idea so you arrive at the venue ready to build.",
          },
        ],
      },
    ],
  },
  {
    id: "ideas",
    nav: "what to build",
    title: "what kind of ideas to build",
    lead: "Not “what problem are you solving”, but “what have you always wanted to make.”",
    blocks: [
      {
        kind: "text",
        text: "Bring the idea you have always wanted to make and never had an excuse for, not a problem to solve. Small, working, and funny before it is clever beats big, half-built, and impressive on paper.",
      },
      {
        kind: "embeds",
        items: [
          { title: "the butterfly dress", permalink: "https://www.instagram.com/reel/DcFekwaB3Wo/" },
          { title: "the portal", permalink: "https://www.instagram.com/reel/DccXPPzBWK9/" },
          { title: "the LED street fighter", permalink: "https://www.instagram.com/reel/DbdWXCoBx6V/" },
        ],
      },
    ],
  },
  {
    id: "during",
    nav: "during the hackathon",
    title: "to get started",
    lead: "No fixed minute-by-minute schedule. Venue-wise programs run their own version of the day.",
    blocks: [
      {
        kind: "text",
        text: "Each venue runs its own program on the day; there's no single national schedule. Your venue host will walk you through timings, meals, and format when you arrive.",
      },
      {
        kind: "steps",
        items: [
          {
            title: "Fork and clone the starter repo",
            text: "Here's the repo you'll build on top of.",
            href: "https://github.com/tinkerhub/useless_project_temp",
            linkLabel: "github.com/tinkerhub/useless_project_temp",
          },
        ],
      },
      {
        kind: "gallery",
        items: [
          { title: "1. fork it", text: "Hit Fork to copy it to your own account.", image: "/handbook/fork-guide.png" },
          { title: "2. clone it", text: "Hit Code, copy the HTTPS URL, and clone it locally.", image: "/handbook/clone-guide.png" },
        ],
      },
      {
        kind: "steps",
        items: [
          {
            title: "Keep an updated README",
            text: "Keep an updated README and a well-documented repo, so judges and other participants can find it.",
          },
        ],
      },
      {
        kind: "note",
        text: "Enjoy the process of making. Be kind, help the people stuck next to you, learn out loud, share what you know, and build.",
      },
    ],
  },
  {
    id: "help",
    nav: "getting help",
    title: "who to talk to",
    lead: "Help comes from two rings: the room you're in, and the wider TinkerHub community.",
    blocks: [
      {
        kind: "text",
        text: "Who's a mentor? Could be someone wearing a mentor badge, or it could just be the person sitting next to you. There is no such thing as a question too small; half of them will be about a cable.",
      },
      {
        kind: "creatures",
        items: [
          { label: "Your venue itself", image: "/ele1.webp" },
          {
            label: "The larger TinkerHub community",
            image: "/ele3a.webp",
            hoverFrames: ["/ele3a.webp", "/ele3b.webp", "/ele3c.webp"],
          },
          { label: "Campus team", image: "/ele4.webp" },
          { label: "Foundation team", image: "/ele5a.webp" },
        ],
      },
    ],
  },
  {
    id: "submit",
    nav: "submission",
    title: "how to submit and get judged",
    lead: "Submission happens in the same app you applied through.",
    blocks: [
      {
        kind: "steps",
        items: [
          {
            title: "Submit in the hub app",
            text: (
              <>
                Same app you used to apply. Update your README properly.{" "}
                <strong>
                  If it&apos;s software, deploy it: a live link and a GitHub repo are needed. If it&apos;s hardware, an
                  updated README with diagrams, photos, and videos is needed.
                </strong>
              </>
            ),
            href: "https://www.instagram.com/p/DMxhr0-vUj7/",
            linkLabel: "guide: how to submit your project in the Hub app",
          },
          {
            title: "Venue-wise validated projects present",
            text: "Your venue host reviews and validates submissions, then validated projects present at the venue.",
          },
          {
            title: "Community voting",
            text: "After presentations, voting is opened to the community.",
          },
          {
            title: "Venue-wise best projects shown",
            text: "Once voting closes, the best projects at each venue are shown. There's no prize distribution at the venue itself.",
          },
          {
            title: "Foundation announces final results",
            text: (
              <>
                A few weeks after the hackathon, the Foundation reviews the venue-wise best projects and announces the
                final results.
                <br />
                <br />
                Judging criteria: <strong>60% Creativity</strong>, <strong>20% Implementation Complexity</strong>,{" "}
                <strong>20% Cross-Disciplinary Approach</strong>.
              </>
            ),
          },
        ],
      },
    ],
  },
  {
    id: "prizes",
    nav: "prizes",
    title: "prizes",
    lead: "There is no scoring rubric worth defending, so here is roughly what impresses us, and what happens if it impresses us enough.",
    blocks: [
      {
        kind: "subheading",
        text: "main quests",
      },
      {
        kind: "text",
        text: "Hit these and you're in line for a real prize.",
      },
      {
        kind: "prizes",
        size: "lg",
        items: [
          { label: "top 25 makers", text: "The 25 highest-scoring makers get a monthly scholarship from a total pool of ₹5 lakh.", image: "/handbook/5l.png" },
          { label: "top 50 projects", text: "The 50 highest-scoring projects get a showcase slot at Maker Faire Kochi.", image: "/handbook/MF_Kochi_Logo_square.png", imageScale: 1.05 },
          { label: "goodies bag", text: "Selected participants take home a goodies bag.", image: "/handbook/goodie-bag.png" },
          { label: "mentorship & learning access", text: "Selected participants get mentorship from industry experts and access to exclusive learning programs.", image: "/handbook/teachign.png", imageScale: 0.85 },
        ],
      },
      {
        kind: "subheading",
        text: "side quests",
      },
      {
        kind: "text",
        text: "Smaller extras for specific things done well.",
      },
      {
        kind: "prizes",
        size: "sm",
        items: [
          // Items with a real badge image sort first; the rest (still real prizes, just no
          // matching art yet) follow after, falling back to the default star medal.
          {
            label: "video journal",
            text: "Top 3 get a ₹5,000 hardware kit each",
            image: "/handbook/build-documentary.png",
            slug: "best-build-video-documentary",
          },
          {
            label: "venue after-movie",
            text: "Top 3 venues get a ₹10,000 hardware kit each",
            image: "/handbook/aftermovie-venue.png",
            slug: "venue-aftermovie",
          },
          {
            label: "project journal",
            text: "Top 3 get a ₹5,000 hardware kit each",
            image: "/handbook/journal.png",
            slug: "journal-repo",
          },
          {
            label: "best hardware project",
            text: "₹3,000 worth of prizes",
            image: "/handbook/hardware.png",
            slug: "best-hardware-project",
          },
          {
            label: "best finished project",
            text: "₹3,000 worth of prizes",
            image: "/handbook/finished-project.png",
            slug: "best-finished-project",
          },
          {
            label: "best use of local LLMs",
            text: "₹3,000 worth of prizes",
            image: "/handbook/llm.png",
            slug: "best-use-of-local-llms",
          },
          {
            label: "best pcb design / custom hardware",
            text: "Clean routing, smart parts, or solder-mask art.",
            image: "/handbook/processor.png",
            slug: "best-pcb-design",
          },
          {
            label: "most complex 3d printed assembly",
            text: "Tight tolerances or print-in-place mechanisms.",
            image: "/handbook/3d.png",
            slug: "best-3d-printed-assembly",
          },
          {
            label: "best reverse engineering / hardware hack",
            text: "Tear down e-waste, repurpose it into something new.",
            image: "/handbook/revverse.png",
            slug: "best-reverse-engineering-hack",
          },
          {
            label: "best interactive physical installation",
            text: "Kinetic, audio-reactive, or projection-mapped art.",
            image: "/handbook/display.png",
            slug: "best-interactive-installation",
          },
          {
            label: "best custom input device / alternative controller",
            text: "A controller built to play a game in an unusual way.",
            image: "/handbook/gaem.png",
            slug: "best-custom-input-device",
          },
          {
            label: "best fashion tech & wearables",
            text: "Soft circuits or flexible displays, worn as clothing.",
            slug: "best-fashion-tech-wearables",
          },
          {
            label: "best superhero / sci-fi gadget",
            text: "A working replica of a superhero or sci-fi tool.",
            slug: "best-superhero-sci-fi-gadget",
          },
          {
            label: "best game / interactive media",
            text: "Standout gameplay, artwork, sound, and storytelling.",
            slug: "best-game-interactive-media",
          },
          {
            label: "best retro-futurism / analog hack",
            text: "Vintage tech hacked to talk to microcontrollers.",
            slug: "best-retro-futurism-hack",
          },
          {
            label: "best edge ai / embedded systems",
            text: "AI or computer vision running on-device.",
            slug: "best-edge-ai-embedded-systems",
          },
          {
            label: "best system integration",
            text: "Mismatched APIs and protocols, stitched together.",
            slug: "best-system-integration",
          },
          {
            label: "best bio / materials tech",
            text: "Bio-sensors, organisms, or sustainable materials.",
            slug: "best-bio-materials-tech",
          },
          {
            label: "most over-engineered solution to a non-problem",
            text: "An absurdly complex fix for a trivial task.",
            slug: "most-over-engineered-solution",
          },
        ],
      },
      {
        kind: "list",
        items: [
          "Commitment to the bit. A fully realised silly idea beats a half-built clever one.",
          "It works. Or it fails in an entertaining and clearly deliberate way.",
          "Craft. Whatever you're making, make it well.",
          "The demo. Well spent, in front of a room that wants you to succeed.",
        ],
      },
      {
        kind: "note",
        text: "For both video journal and venue after-movie, you need to submit an application here.",
      },
    ],
  },
  {
    id: "rules",
    nav: "rules",
    title: "the rules",
    lead: "Short list. We would rather spend the weekend building than adjudicating.",
    blocks: [
      {
        kind: "list",
        items: [
          "Build during the event.",
          "Building with AI is welcome, as long as you learn and have fun.",
          "Be decent to each other. The code of conduct applies to the whole event, online and off.",
        ],
      },
      {
        kind: "text",
        text: "Anything not covered here is decided by the organisers on the day, and we will always err towards letting you build the thing.",
      },
    ],
  },
  {
    id: "resources",
    nav: "resources",
    title: "the fine print, shelved",
    lead: "We're a free community, but a free community still runs on ground rules. Here's where ours live.",
    blocks: [
      {
        kind: "links",
        items: [
          {
            tag: "the shelf",
            label: "TinkerHub Shelf",
            href: "https://tinkerhub.gitbook.io/th-shelf",
            text: "Code of conduct, privacy policy, and terms, all shelved in one place instead of scattered across three PDFs nobody opens. Skim it for the jokes, stay for the part that actually governs the event.",
          },
        ],
      },
    ],
  },
  {
    id: "emergency",
    nav: "venue & emergencies",
    title: "venue issues and emergencies",
    lead: "Anything about the venue, or any emergency, goes to the host or the organisers, not to us after the fact.",
    blocks: [
      {
        kind: "text",
        text: "Any venue problem (power, seating, wifi, food, safety) or emergency during the event should be reported immediately to your on-site host or the organising team. The venue and host are the point of contact for anything happening live on-site.",
      },
    ],
  },
];

// Card chrome shared by the "cards" block and the enriched "links" block - same recipe the FAQ
// section's question cards use (see faq-section.tsx), so a handbook card and an FAQ card read as
// the same object even though they're built independently.
const CARD_CLASS = "rounded-2xl border border-black/5 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm";

// Small caps label used for a card or link's category word (e.g. "form", "docs") - plain text,
// not a chip, so it doesn't compete with the actual prize medals below.
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-helvetica text-[11px] tracking-[0.08em] text-[#33322f]/50 uppercase">{children}</span>
  );
}

// A twelve-point scalloped seal, like a certificate stamp, computed once at module load rather
// than hand-typed as an SVG path - the only thing that differs per size is the viewBox scale.
function buildSealPath(cx: number, cy: number, outerR: number, innerR: number, points: number) {
  const step = Math.PI / points;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return `${d}Z`;
}
const SEAL_PATH = buildSealPath(50, 42, 42, 36, 12);

// The actual "badge" the user meant: a collectible medal, one per prize, not a UI chip. Ribbon
// tails sit behind the seal so the seal's bottom scallops read as pinned on top of them.
function PrizeMedal({
  label,
  text,
  size = "lg",
  locked = false,
  image,
  imageScale = 1.2,
  slug,
}: {
  label: string;
  text?: string;
  size?: "sm" | "lg";
  locked?: boolean;
  image?: string;
  imageScale?: number;
  slug?: string;
}) {
  const svgSize = size === "lg" ? 112 : 92;
  const boxWidth = 140;
  const imageSize = svgSize * imageScale;
  // Every icon (medal SVG or badge image) sits in a slot of the same height per size variant,
  // so the label underneath lines up across a row even when a badge image scales larger than
  // the medal it's standing in for.
  const slotHeight = size === "lg" ? 150 : 150;
  // Side quests (sm) carry more text in a narrower column than the main quests do, so they get
  // a little extra breathing room between the icon, label, and description rather than sharing
  // the main quests' tighter gap.
  const stackGap = size === "lg" ? "gap-2" : "gap-2.5";
  // Main quests stay centered under their medal icon; side quests - denser, more text-heavy -
  // read better left-aligned instead of centered ragged-line text.
  const stackAlign = size === "lg" ? "items-center text-center" : "items-start text-left";
  const medal = (
    <>
      <div className="flex items-center justify-center" style={{ height: slotHeight }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="max-w-none object-contain"
            style={{ width: imageSize, height: imageSize }}
          />
        ) : (
          <svg viewBox="0 0 100 108" width={svgSize} height={svgSize * 1.08} aria-hidden="true">
            <path d="M38,72 L28,104 L50,90 Z" fill="#1b352a" />
            <path d="M62,72 L72,104 L50,90 Z" fill="#244638" />
            <path d={SEAL_PATH} fill="#ea34df" />
            <circle cx="50" cy="42" r="28" fill="#fff" />
            <circle cx="50" cy="42" r="28" fill="none" stroke="#ea34df" strokeWidth="2" strokeDasharray="3 3.5" />
            <text
              x="50"
              y="53"
              textAnchor="middle"
              fontSize="30"
              fill="#ea34df"
              style={{ fontFamily: "var(--font-drowner)" }}
            >
              ★
            </text>
          </svg>
        )}
      </div>
      <span
        className={`font-nanum-pen leading-[1.1] text-[#0e0e0d] ${
          size === "lg" ? "text-[20px]" : "line-clamp-2 min-h-[2.3em] text-[20px]"
        }`}
      >
        {label}
      </span>
      {text && (
        <span
          className={`font-helvetica leading-[1.4] text-[#33322f] ${
            size === "lg" ? "text-[13px]" : "line-clamp-2 min-h-[2.9em] text-[12px] font-bold"
          }`}
        >
          {text}
        </span>
      )}
      {slug && !locked && (
        <span className="font-helvetica mt-1 inline-flex items-center gap-1 rounded-full border border-[#ea34df] px-3 py-1 text-[10px] font-bold tracking-[0.05em] text-[#ea34df] uppercase transition-colors group-hover:bg-[#ea34df] group-hover:text-white">
          know more
        </span>
      )}
    </>
  );
  return (
    <li className={`relative flex flex-col ${stackAlign} ${stackGap}`} style={{ width: `${boxWidth}px` }}>
      {slug && !locked ? (
        <Link
          href={`/competitions/${slug}`}
          className={`group flex flex-col ${stackAlign} ${stackGap} transition-transform hover:scale-[1.04]`}
        >
          {medal}
        </Link>
      ) : (
        <div className={locked ? `flex flex-col ${stackAlign} ${stackGap} blur-[3px] opacity-40 select-none` : `flex flex-col ${stackAlign} ${stackGap}`}>
          {medal}
        </div>
      )}
      {locked && (
        <span className="font-helvetica absolute inset-0 flex items-center justify-center text-[11px] tracking-[0.08em] text-[#33322f] uppercase">
          to be unlocked
        </span>
      )}
    </li>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, i) => {
        // Text-shaped blocks stay capped in ch rather than px: at the full 786px content column
        // the body ran to about 100 characters a line, well past a comfortable measure for a page
        // meant to be read through. Grid-shaped blocks (badges/cards/gallery) below skip the cap
        // so they can use the whole column width.

        if (block.kind === "text") {
          return (
            <p key={i} className="font-helvetica max-w-[68ch] text-[16px] leading-[1.7] text-[#33322f] sm:text-[17px]">
              {block.text}
            </p>
          );
        }

        if (block.kind === "note") {
          return (
            <p
              key={i}
              className="font-nanum-pen max-w-[68ch] border-l-[3px] border-[#ea34df] pl-4 text-[19px] leading-[1.45] text-[#244638] sm:text-[21px]"
            >
              {block.text}
            </p>
          );
        }

        if (block.kind === "subheading") {
          return (
            <h3 key={i} className="font-drowner mt-2 leading-[1] text-[#0e0e0d]" style={{ fontSize: "clamp(24px, 3.5vw, 32px)" }}>
              {block.text}
            </h3>
          );
        }

        if (block.kind === "prizes") {
          return (
            <ul key={i} className="flex flex-wrap justify-center gap-x-6 gap-y-8 py-2 sm:justify-start">
              {block.items.map((item, itemIndex) => (
                <PrizeMedal key={`${item.label}-${itemIndex}`} label={item.label} text={item.text} size={block.size} locked={item.locked} image={item.image} imageScale={item.imageScale} slug={item.slug} />
              ))}
            </ul>
          );
        }

        if (block.kind === "creatures") {
          // 1st and 4th sit at the back on the same plane; 3rd steps in front of them; 2nd steps
          // in front of that - a specific front-to-back order, not just left-to-right stacking.
          // Each step forward also grows a little and drops a little lower, like it's standing
          // closer to the camera rather than just being drawn on top.
          const CROWD_Z = [1, 3, 2, 1];
          const CROWD_FRONT_CLASS = ["", "translate-y-2 scale-110", "translate-y-1 scale-105", ""];
          return (
            // A crowd, not a grid: each one overlaps the last, sitting still until you hover -
            // then it steps in front, grows, and names itself, the way a huddled group would
            // when you single one out. Extra left padding beyond the plain container gap nudges
            // the whole huddle right, since the overlap otherwise reads as pulled to the left edge.
            <ul key={i} className="flex items-center justify-center py-4 sm:justify-start sm:pl-32">
              {block.items.map((item, itemIndex) => {
                return (
                  <li
                    key={item.label}
                    className={`group relative -ml-4 transition-transform duration-200 first:ml-0 hover:z-10 hover:scale-125 ${CROWD_FRONT_CLASS[itemIndex] ?? ""}`}
                    style={{ zIndex: CROWD_Z[itemIndex] ?? itemIndex }}
                  >
                    {item.hoverFrames ? (
                      // Fixed square box (not w-auto) - the burst frames don't all share the same
                      // intrinsic width, and letting the box follow that would shove every creature
                      // to its right sideways and back on each frame swap.
                      <HoverFrames frames={item.hoverFrames} className="h-16 w-16 object-contain sm:h-20 sm:w-20" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" aria-hidden="true" className="h-16 w-auto object-contain sm:h-20" />
                    )}
                    {/* Just the name, in the site's handwritten voice - no pill, no background,
                        nothing else competing with it. */}
                    <span className="font-nanum-pen pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 text-[18px] whitespace-nowrap text-[#0e0e0d] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        if (block.kind === "cards") {
          // These are parallel options, not a sequence, so no step numbering - just an eyebrow
          // tag to categorize each one.
          return (
            <ul key={i} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {block.items.map((card) => (
                <li key={card.title} className={`flex flex-col gap-1.5 ${CARD_CLASS}`}>
                  {card.image ? (
                    <span className="mb-1 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={card.image} alt="" aria-hidden="true" className="h-10 w-10 shrink-0 object-contain" />
                      <span className="flex flex-col gap-0.5">
                        {card.tag && <Eyebrow>{card.tag}</Eyebrow>}
                        <span className="font-nanum-pen text-[21px] leading-[1.2] text-[#0e0e0d] sm:text-[23px]">
                          {card.title}
                        </span>
                      </span>
                    </span>
                  ) : (
                    <>
                      {card.tag && <Eyebrow>{card.tag}</Eyebrow>}
                      <span className="font-nanum-pen text-[21px] leading-[1.2] text-[#0e0e0d] sm:text-[23px]">
                        {card.title}
                      </span>
                    </>
                  )}
                  <span className="font-helvetica text-[15px] leading-[1.6] text-[#33322f]">{card.text}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === "gallery") {
          // Same fanned, overlapping pile as the "embeds" block below - resting rotated and
          // stacked, straightening, growing, and jumping to the front on hover.
          const GALLERY_ROTATIONS = [-5, 4];
          const GALLERY_OVERLAP_PX = 40;
          return (
            <ul key={i} className="flex w-full max-w-[68ch] justify-center py-2">
              {block.items.map((item, idx) => (
                <li
                  key={item.title}
                  className="group relative z-[var(--z)] flex w-[220px] shrink-0 flex-col gap-3 rotate-[var(--rot)] rounded-2xl border border-black/5 bg-white p-3 shadow-xs transition-transform duration-300 ease-out hover:z-40 hover:rotate-0 hover:scale-[1.3]"
                  style={
                    {
                      marginLeft: idx === 0 ? 0 : -GALLERY_OVERLAP_PX,
                      "--z": idx,
                      "--rot": `${GALLERY_ROTATIONS[idx % GALLERY_ROTATIONS.length]}deg`,
                    } as React.CSSProperties
                  }
                >
                  {/* Placeholder tile until real photos land - swap `image` in on the data item
                      and this renders it in place of the "coming soon" note, no markup changes. */}
                  <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-black/10 bg-[#f5f4f0]">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.title} className="size-full cursor-zoom-in object-cover" />
                    ) : (
                      <span className="font-helvetica px-4 text-center text-[14px] leading-[1.3] text-[#33322f]/40">
                        image coming soon
                      </span>
                    )}
                  </div>
                  {item.image && (
                    // The small thumbnail above is cropped to a 4:3 tile, which isn't enough to
                    // actually read a screenshot's UI text - hovering pops this full, uncropped
                    // version up over the page instead of relying on an in-place zoom that would
                    // just magnify the same crop.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-1/2 z-30 w-[680px] max-w-[92vw] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 scale-95 rounded-xl border border-black/10 bg-white object-contain p-1 opacity-0 shadow-2xl transition-[opacity,transform] duration-150 group-hover:scale-100 group-hover:opacity-100"
                    />
                  )}
                  <div className="flex flex-col gap-1 px-1 pb-1">
                    <span className="font-nanum-pen text-[19px] leading-[1.2] text-[#0e0e0d] sm:text-[21px]">
                      {item.title}
                    </span>
                    <span className="font-helvetica text-[15px] leading-[1.6] text-[#33322f]">{item.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === "video") {
          return (
            <div key={i} className="max-w-[68ch] overflow-hidden rounded-2xl border border-black/5 shadow-xs">
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${block.youtubeId}`}
                  title={block.title}
                  className="absolute inset-0 size-full"
                  frameBorder={0}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          );
        }

        if (block.kind === "embeds") {
          // A fanned, overlapping pile - like a loose stack of photo frames - rather than a grid
          // or a scrolling filmstrip. Cards overlap by a fixed pixel amount (not a percentage), so
          // the whole stack's footprint is the same ~270px at any viewport width instead of
          // stretching wide on desktop or overflowing on mobile. Hovering a card straightens and
          // lifts it to the front so the one you're looking at is never the one half-hidden.
          const EMBED_SCALE = 0.38;
          const CARD_ROTATIONS = [-6, 3, -4];
          const OVERLAP_PX = 50;
          // Centered against the 68ch text column above it, not the full (wider) grid track -
          // otherwise the extra whitespace past the text's own line length pulls the stack
          // visibly right of where the paragraph above it reads as "centered".
          return (
            <ul key={i} className="flex w-full max-w-[68ch] justify-center py-2">
              {block.items.map((item, idx) => (
                <li
                  key={item.permalink}
                  // z-index has to come from a class (z-[var(--z)]), not inline style - an inline
                  // `style.zIndex` beats a `hover:z-40` class outright regardless of hover state,
                  // which is why the hovered card wasn't actually reaching the front before.
                  className={`relative z-[var(--z)] flex shrink-0 flex-col items-center gap-2 !p-3 rotate-[var(--rot)] transition-transform duration-300 ease-out hover:z-40 hover:rotate-0 hover:scale-[1.75] ${CARD_CLASS}`}
                  style={
                    {
                      marginLeft: idx === 0 ? 0 : -OVERLAP_PX,
                      "--z": idx,
                      "--rot": `${CARD_ROTATIONS[idx % CARD_ROTATIONS.length]}deg`,
                    } as React.CSSProperties
                  }
                >
                  <span className="font-nanum-pen self-start text-[15px] leading-[1.2] text-[#0e0e0d]">
                    {item.title}
                  </span>
                  <InstagramEmbed permalink={item.permalink} scale={EMBED_SCALE} />
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === "links") {
          return (
            <ul key={i} className="flex max-w-[68ch] flex-col gap-3">
              {block.items.map((item) => (
                <li key={item.label} className={`flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4 ${CARD_CLASS}`}>
                  {item.tag && (
                    <span className="pt-[2px] sm:pt-0">
                      <Eyebrow>{item.tag}</Eyebrow>
                    </span>
                  )}
                  <span className="flex flex-col gap-1">
                    <a
                      href={item.href}
                      className="font-nanum-pen text-[19px] leading-[1.2] text-[#0e0e0d] underline decoration-[#ea34df] decoration-2 underline-offset-4 transition-colors hover:text-[#ea34df] sm:text-[21px]"
                    >
                      {item.label}
                    </a>
                    <span className="font-helvetica text-[15px] leading-[1.6] text-[#33322f]">{item.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={i} className="flex max-w-[68ch] flex-col gap-3">
              {block.items.map((item, itemIndex) => (
                <li
                  key={item}
                  className="font-helvetica relative pl-9 text-[16px] leading-[1.7] text-[#33322f] sm:text-[17px]"
                >
                  {/* A real multi-block lego piece instead of a plain bullet dot - a checklist
                      made of little built things, not colored dots. Fixed-size slot (rather than
                      sizing the SVG itself to fit pl-9) so the widest shape (line, 1x3) can't
                      grow past its column and run into the text next to it. */}
                  <span className="absolute top-[0.3em] left-0 flex size-6 shrink-0 items-center justify-center">
                    <LegoBlock
                      shape={STEP_SHAPES[itemIndex % STEP_SHAPES.length]}
                      color={STUD_COLORS[itemIndex % STUD_COLORS.length]}
                      aria-hidden="true"
                      style={legoStyle(STEP_SHAPES[itemIndex % STEP_SHAPES.length], 6.5)}
                    />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <ol key={i} className="flex max-w-[68ch] flex-col gap-5">
            {block.items.map((step, stepIndex) => (
              <li key={step.title} className="flex gap-4">
                {/* A real multi-block lego piece instead of a "01/02" number - these are the
                    site's actual tetromino shapes and brick colors, cycled per step so the
                    sequence reads as a little built-up row rather than a numbered list. */}
                <div className="flex size-7 shrink-0 items-center justify-center">
                  <LegoBlock
                    shape={STEP_SHAPES[stepIndex % STEP_SHAPES.length]}
                    color={STUD_COLORS[stepIndex % STUD_COLORS.length]}
                    className="animate-lego-pop"
                    style={legoStyle(STEP_SHAPES[stepIndex % STEP_SHAPES.length], 8)}
                  />
                </div>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-nanum-pen text-[21px] leading-[1.2] text-[#0e0e0d] sm:text-[23px]">
                    {step.title}
                  </span>
                  <span className="font-helvetica text-[16px] leading-[1.7] text-[#33322f] sm:text-[17px]">
                    {step.text}
                  </span>
                  {step.href && (
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-helvetica w-fit max-w-full text-[15px] break-words text-[#ea34df] underline decoration-[#ea34df] decoration-2 underline-offset-4 transition-colors hover:text-[#0e0e0d]"
                    >
                      {step.linkLabel ?? step.href}
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}

// The floating checklist widget's content - kept separate from SECTIONS since it isn't a page
// block, it's a fixed overlay that rides along the whole page regardless of scroll position.
const CHECKLIST_GROUPS = [
  {
    title: "Checklist",
    items: [
      "Checked in at my venue.",
      "Read the participant handbook.",
      "Built my project.",
      "Kept my README updated throughout.",
      "Added a deployed link (for software projects) or a video (for hardware projects).",
      "Did a final README update.",
      "Submitted my project on the app.",
      "Documented my build.",
      "Voted for other projects.",
    ],
  },
  {
    title: "Optional",
    items: ["Completed side quests to earn extra prizes."],
  },
];

export default function HandbookPage() {
  return (
    // data-page is what turns the root layout's mandatory scroll snapping off for this route - see
    // globals.css. The home page is a deck of full-screen panels; this is a document.
    // overflow-x-clip guards against the page's decorative bits - fanned/rotated card piles,
    // the full-size hover-preview popups, the overlapping creature crowd - pushing the document
    // wider than the viewport on narrow screens and introducing an unwanted horizontal scrollbar.
    // Uses `clip` rather than `hidden`: `overflow-x-hidden` alone forces the other axis to
    // `auto` per spec, turning this element into a scroll container - which breaks the sidebar
    // nav's `position: sticky` below (sticky elements stick to their nearest scrolling ancestor,
    // not the viewport, once one exists). `clip` achieves the same visual clipping without
    // creating that scroll container.
    <main data-page="handbook" className="w-full overflow-x-clip bg-white text-[#0e0e0d]">
      {/* Extra right padding reserves room for the checklist widget's collapsed edge tab (shown
          at every width now that the full README checklist is too long to hold open on the
          side), so it sits clear of the page copy instead of sitting on top of it. */}
      <div className="mx-auto w-full max-w-[1120px] px-5 pr-11 sm:px-8 sm:pr-12 lg:pl-10 lg:pr-16">
        <header className="relative flex flex-col gap-6 border-b border-black/10 py-14 sm:py-20">
          {/* Flex-centered against the heading rather than absolutely positioned with a guessed
              top offset - the heading's fluid clamp() size means its box height keeps changing
              across viewports, so any fixed top value drifts out of alignment at some width. */}
          <h1
            className="font-drowner leading-[0.9] text-[#0e0e0d]"
            // Fluid rather than stepped, so the title fills the measure at every width instead of
            // jumping at breakpoints - it is the one element big enough for the difference to show.
            style={{ fontSize: "clamp(56px, 13vw, 132px)", letterSpacing: "0.02em" }}
          >
            handbook
          </h1>
          <p className="font-nanum-pen max-w-[46ch] text-[21px] leading-[1.4] text-[#244638] sm:text-[24px]">
            Everything worth knowing before you build something nobody asked for. Rules, timings, and how to take
            part.
          </p>
          {/* The hero's breathing corner-dot badges, same asset set and behaviour - hovering
              swaps each to a random other color from the set. A little scattered cluster rather
              than a single dot, matching how the homepage hero uses more than one. */}
          <HoverDot assets={DOT_ASSETS} baseIndex={2} size={28} className="absolute top-2 right-28 hidden sm:block lg:right-40" />
          <HoverDot assets={DOT_ASSETS} baseIndex={0} size={16} className="absolute top-16 right-16 hidden sm:block lg:right-28" />
          <HoverDot assets={DOT_ASSETS} baseIndex={3} size={20} className="absolute bottom-6 left-2 hidden sm:block" />
        </header>

        <div className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-16 lg:py-16">
          {/* Sticks alongside the content on wide screens; above it, and scrollable sideways if the
              list ever outgrows the width, on narrow ones. */}
          <nav aria-label="Handbook sections" className="hidden lg:sticky lg:top-12 lg:block lg:self-start">
            <p className="font-helvetica mb-4 text-[12px] tracking-[0.1em] text-[#33322f]/60 uppercase">Contents</p>
            <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:gap-3 lg:overflow-visible lg:px-0">
              {SECTIONS.map((section) => (
                <li key={section.id} className="shrink-0">
                  <a
                    href={`#${section.id}`}
                    className="font-nanum-pen block rounded-full border border-black/10 px-4 py-1.5 text-[18px] whitespace-nowrap text-[#33322f] transition-colors hover:border-[#ea34df] hover:text-[#ea34df] lg:rounded-none lg:border-0 lg:px-0 lg:py-0 lg:text-[20px]"
                  >
                    {section.nav}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex min-w-0 flex-col gap-14 sm:gap-16">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-8 flex flex-col gap-5">
                <h2
                  className="font-drowner leading-[1] text-[#0e0e0d]"
                  style={{ fontSize: "clamp(34px, 6vw, 54px)" }}
                >
                  {section.title}
                </h2>
                <p className="font-nanum-pen max-w-[52ch] text-[20px] leading-[1.4] text-[#244638] sm:text-[22px]">
                  {section.lead}
                </p>
                <Blocks blocks={section.blocks} />
              </section>
            ))}
          </div>
        </div>

        <footer className="flex flex-col gap-4 border-t border-black/10 py-12 sm:py-14">
          <p className="font-nanum-pen text-[20px] leading-[1.4] text-[#244638]">
            Still have a question?{" "}
            <a
              href="mailto:campus@tinkerhub.org"
              className="underline decoration-[#ea34df] decoration-2 underline-offset-4 transition-colors hover:text-[#ea34df]"
            >
              campus@tinkerhub.org
            </a>
          </p>
        </footer>
      </div>

      <ChecklistWidget storageKey="handbook-checklist" groups={CHECKLIST_GROUPS} />
    </main>
  );
}
