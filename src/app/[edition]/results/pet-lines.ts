import type { DialogueItem, SectionConfig } from "@/app/floating-pet";

// What the home page's floating elephant says on the results page, one line pair per section - it
// pops the bubble as each section scrolls into view, and a click or hover brings it back.
const small = (lines: string[]): DialogueItem => ({
  bubbleSrc: "/timer-bubble.svg",
  bubbleWidth: 130,
  bubbleHeight: 90,
  textLeft: 8,
  textTop: 10,
  textWidth: 100,
  textHeight: 62,
  fontSize: 18,
  lineHeight: 16,
  lines,
});

const big = (lines: string[]): DialogueItem => ({
  bubbleSrc: "/funfact-bubble.svg",
  bubbleWidth: 170,
  bubbleHeight: 118,
  textLeft: 10,
  textTop: 10,
  textWidth: 130,
  textHeight: 88,
  fontSize: 16,
  lineHeight: 15,
  lines,
});

export const RESULTS_PET_LINES: SectionConfig[] = [
  { id: "main-quest", dialogue: small(["meet the", "winners!"]) },
  { id: "top-projects", dialogue: big(["so many more", "to explore!"]) },
  { id: "side-quests", dialogue: small(["side quests,", "best quests"]) },
  { id: "note", dialogue: big(["thank you", "for building!"]) },
  { id: "video", dialogue: small(["goodies", "incoming!"]) },
];

// Tapping the pet answers the one question everyone has.
export const RESULTS_PET_TAP: DialogueItem = {
  ...big(["how to claim?", "winners get an email", "with all the details!"]),
  fontSize: 15,
  lineHeight: 15,
};
