"use client";

import { useEffect, useState, useRef } from "react";
import AnimatedElephant from "./animated-elephant";

const ELE5_SECONDARY_FRAMES = [
  "/ele5f.webp",
  "/ele5g.webp",
  "/ele5h.webp",
  "/ele5i.webp",
  "/ele5j.webp",
];

export interface DialogueItem {
  bubbleSrc: string;
  bubbleWidth: number;
  bubbleHeight: number;
  textLeft: number;
  textTop: number;
  textWidth: number;
  textHeight: number;
  fontSize: number;
  lineHeight: number;
  lines: string[];
  href?: string;
}

export interface SectionConfig {
  id: string;
  dialogue: DialogueItem;
}

const SECTION_CONFIGS: SectionConfig[] = [
  {
    id: "why-section",
    dialogue: {
      bubbleSrc: "/funfact-bubble.svg",
      bubbleWidth: 170,
      bubbleHeight: 118,
      textLeft: 10,
      textTop: 10,
      textWidth: 130,
      textHeight: 88,
      fontSize: 16,
      lineHeight: 15,
      lines: ["fun fact", "we started in 2024!"],
    },
  },
  {
    id: "appam-section",
    dialogue: {
      bubbleSrc: "/timer-bubble.svg",
      bubbleWidth: 130,
      bubbleHeight: 90,
      textLeft: 8,
      textTop: 10,
      textWidth: 100,
      textHeight: 62,
      fontSize: 18,
      lineHeight: 16,
      lines: ["cool", "right?"],
    },
  },
  {
    id: "see-all-section",
    dialogue: {
      bubbleSrc: "/funfact-bubble.svg",
      bubbleWidth: 170,
      bubbleHeight: 118,
      textLeft: 10,
      textTop: 10,
      textWidth: 130,
      textHeight: 88,
      fontSize: 16,
      lineHeight: 15,
      lines: ["so many people", "built projects!"],
    },
  },
  {
    id: "faq-section",
    dialogue: {
      bubbleSrc: "/funfact-bubble.svg",
      bubbleWidth: 190,
      bubbleHeight: 130,
      textLeft: 12,
      textTop: 12,
      textWidth: 148,
      textHeight: 95,
      fontSize: 15,
      lineHeight: 14,
      lines: ["want to know more?", "mail at campus@tinkerhub.org"],
      href: "mailto:campus@tinkerhub.org",
    },
  },
  {
    id: "timer-section",
    dialogue: {
      bubbleSrc: "/timer-bubble.svg",
      bubbleWidth: 130,
      bubbleHeight: 90,
      textLeft: 8,
      textTop: 10,
      textWidth: 100,
      textHeight: 62,
      fontSize: 18,
      lineHeight: 16,
      lines: ["get ready", "to build!"],
    },
  },
];

// `sections` and `startId` default to the home page's; other pages (the results page) pass their own
// section ids and lines. The pet appears once `startId`'s section scrolls into view. `tapDialogue`,
// when given, is what the pet says when it's clicked or tapped, instead of repeating the section's
// line - the results page uses it to answer "how to claim?".
export default function FloatingPet({
  sections = SECTION_CONFIGS,
  startId = "why-section",
  tapDialogue,
}: {
  sections?: SectionConfig[];
  startId?: string;
  tapDialogue?: DialogueItem;
} = {}) {
  const [showTapDialogue, setShowTapDialogue] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>(startId);
  const [isDialogueOpen, setIsDialogueOpen] = useState(false);
  const isHoveredRef = useRef(false);
  const prevSectionRef = useRef<string | null>(null);

  // Monitor scroll position and detect which section is currently active
  useEffect(() => {
    const handleScroll = () => {
      const whyEl = document.getElementById(startId);
      if (!whyEl) return;

      const whyRect = whyEl.getBoundingClientRect();
      const reachedWhy = whyRect.top <= window.innerHeight * 0.85;
      setIsVisible(reachedWhy);

      if (!reachedWhy) return;

      // Find the section that is currently most visible in viewport
      let currentActiveId = startId;
      let minDistance = Infinity;

      for (const config of sections) {
        const el = document.getElementById(config.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const centerDist = Math.abs(rect.top);
          if (rect.top <= window.innerHeight * 0.6 && rect.bottom >= window.innerHeight * 0.2) {
            if (centerDist < minDistance) {
              minDistance = centerDist;
              currentActiveId = config.id;
            }
          }
        }
      }

      // At the very bottom of the page the last section can be too short to ever reach the top of
      // the screen (the results page's closing video on a phone), so it would never win above -
      // there, the last section that's on screen speaks instead.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) {
        for (const config of [...sections].reverse()) {
          const rect = document.getElementById(config.id)?.getBoundingClientRect();
          if (rect && rect.top < window.innerHeight && rect.bottom > 0) {
            currentActiveId = config.id;
            break;
          }
        }
      }

      setActiveSectionId(currentActiveId);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [sections, startId]);

  // Pop up dialogue when entering a new section
  useEffect(() => {
    if (!isVisible) {
      setIsDialogueOpen(false);
      return;
    }

    if (prevSectionRef.current !== activeSectionId) {
      prevSectionRef.current = activeSectionId;
      setShowTapDialogue(false);
      if (!isHoveredRef.current) {
        setIsDialogueOpen(true);
        const timer = setTimeout(() => {
          if (!isHoveredRef.current) setIsDialogueOpen(false);
        }, 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [activeSectionId, isVisible]);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    setIsDialogueOpen(true);
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    setTimeout(() => {
      if (!isHoveredRef.current) {
        setIsDialogueOpen(false);
      }
    }, 1200);
  };

  const handleClick = () => {
    if (tapDialogue) {
      // A tap shows the tap line; tapping again while it's showing puts the bubble away.
      if (isDialogueOpen && showTapDialogue) {
        setIsDialogueOpen(false);
      } else {
        setShowTapDialogue(true);
        setIsDialogueOpen(true);
      }
      return;
    }
    setIsDialogueOpen((prev) => !prev);
  };

  const currentConfig = sections.find((c) => c.id === activeSectionId) || sections[0];
  const currentDialogue = showTapDialogue && tapDialogue ? tapDialogue : currentConfig.dialogue;

  return (
    <div
      className={`fixed bottom-3 right-3 md:bottom-5 md:right-6 z-50 flex flex-col items-end transition-all duration-500 ease-out ${
        isVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-8 pointer-events-none"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Speech Bubble Container - Perfectly proportioned and centered */}
      <div
        className={`relative transition-all duration-300 transform origin-bottom-right mb-1 ${
          isDialogueOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 translate-y-2 pointer-events-none"
        }`}
        style={{
          width: `${currentDialogue.bubbleWidth}px`,
          height: `${currentDialogue.bubbleHeight}px`,
        }}
      >
        <img
          src={currentDialogue.bubbleSrc}
          alt=""
          className="absolute inset-0 size-full pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />
        <div
          className="absolute font-nanum-pen text-center text-[#100f0f] flex flex-col items-center justify-center pointer-events-auto"
          style={{
            left: `${currentDialogue.textLeft}px`,
            top: `${currentDialogue.textTop}px`,
            width: `${currentDialogue.textWidth}px`,
            height: `${currentDialogue.textHeight}px`,
          }}
        >
          <div
            style={{
              fontSize: `${currentDialogue.fontSize}px`,
              lineHeight: `${currentDialogue.lineHeight}px`,
            }}
          >
            {currentDialogue.href ? (
              <a href={currentDialogue.href} className="hover:underline">
                {currentDialogue.lines.map((line, idx) => (
                  <span key={idx}>
                    {line}
                    {idx < currentDialogue.lines.length - 1 && <br />}
                  </span>
                ))}
              </a>
            ) : (
              currentDialogue.lines.map((line, idx) => (
                <span key={idx}>
                  {line}
                  {idx < currentDialogue.lines.length - 1 && <br />}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pet Creature using AnimatedElephant (ele5 webp animation loop) */}
      <button
        type="button"
        onClick={handleClick}
        aria-label="Interactive pet creature"
        className="relative group focus:outline-none cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 w-[38px] h-[60px] md:w-[46px] md:h-[72px]"
      >
        <AnimatedElephant
          secondaryFrames={ELE5_SECONDARY_FRAMES}
          secondaryScale={1.2}
          anchor="center"
          style={{ position: "relative", width: "100%", height: "100%" }}
        />
      </button>
    </div>
  );
}
