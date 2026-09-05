import AppamSection from "./appam-section";
import CelebratingSection from "./celebrating-section";
import DesktopOnly from "./desktop-only";
import { FAQ_ITEMS } from "./faq-data";
import FaqSection from "./faq-section";
import HeroDots from "./hero-dots";
import HeroTagline from "./hero-tagline";
import MobileHero from "./mobile-hero";
import PlayTetrisBubble from "./play-tetris-bubble";
import RevealButton from "./reveal-button";
import SeeAllSection from "./see-all-section";
import TimerSection from "./timer-section";
import Title from "./title";
import TetrisField from "./tetris-field";
import VanishingElephant from "./vanishing-elephant";
import WhySection from "./why-section";

import FloatingPet from "./floating-pet";

// ele4e.webp doesn't exist in public/ - the transition skips from d straight to f.
const ELE4_FRAMES = ["/ele4a.webp", "/ele4b.webp", "/ele4c.webp", "/ele4d.webp", "/ele4f.webp"];

const REF_WIDTH = 1920;
const REF_HEIGHT = 1080;

// Runs as separate 18-hour sessions on Sep 3/4/5/11/12/13, at ~70 campus venues across Kerala
// (not one continuous event at one venue) - marked up as an EventSeries rather than a plain
// Event so the date range and location aren't overclaimed.
const EVENT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "EventSeries",
  name: "Useless Projects 3.0",
  description:
    "An overnight make-a-thon by TinkerHub challenging Campus Community makers to build brilliantly impractical tech (software, hardware, or both). Runs as 18-hour sessions on Sep 3, 4, 5, 11, 12 and 13, 2026, across TinkerHub Campus Community venues in Kerala.",
  startDate: "2026-09-03T09:00:00+05:30",
  endDate: "2026-09-14T03:00:00+05:30",
  location: "Multiple venues across TinkerHub Campus Communities in Kerala, India",
  image: ["https://useless.tinkerhub.org/opengraph-image.png"],
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR", availability: "https://schema.org/InStock", url: "https://useless.tinkerhub.org" },
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  organizer: { "@type": "Organization", name: "TinkerHub", url: "https://tinkerhub.org" },
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(EVENT_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <MobileHero />
      <div className="relative hidden min-h-screen shrink-0 snap-start snap-always items-center justify-center overflow-hidden lg:flex">
        {/* Rendered before the canvas below (and so painted behind it) to match the Figma layer
            order - the title/button/badges sit above the tetris field, which they slightly
            overlap by design (e.g. the reveal button sits right at the skyline's edge).
            DesktopOnly rather than relying on this section's own "hidden lg:flex" alone - a
            display:none element still mounts, still runs its animation/physics loop, and still
            renders its full lego-block grid and particle DOM, just invisibly. MobileHero mounts
            its own TetrisField for the visible mobile skyline, so without this a phone was running
            two of these simultaneously - this drops it back to one. */}
        <DesktopOnly>
          <TetrisField targetCell={68} />
        </DesktopOnly>
        <div
          className="absolute"
          style={{
            width: `${REF_WIDTH}px`,
            height: `${REF_HEIGHT}px`,
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(min(1, calc(100vw / ${REF_WIDTH}px), calc(100vh / ${REF_HEIGHT}px)))`,
            transformOrigin: "center center",
          }}
        >
          {/* Center of the original 90px-wide static box (192px + 90/2 = 237px), shifted 8% of
              REF_WIDTH left (237 - 153.6 = 83.4px) and 13% of REF_HEIGHT down total (280.8 + 54 +
              86.4 = 421.2px, the initial 5% plus another 8%). AnimatedElephant's "center" anchor
              takes `left` as that center point rather than a box edge. Near-continuous frame loop
              (barely any idle pause between bursts) plus a slow autonomous up/down float (not
              mouse-driven, unlike the "3.0" badge's parallax). */}
          <VanishingElephant
            frames={ELE4_FRAMES}
            frameIntervalMs={450}
            minDelayMs={50}
            maxDelayMs={150}
            floatAnimation
            style={{ left: "83.4px", top: "391.2px", height: "100px" }}
          />
          <Title />
          <HeroTagline />
          <RevealButton />
          <PlayTetrisBubble />
          <HeroDots />
        </div>
      </div>
      <CelebratingSection />
      <WhySection />
      <AppamSection />
      <SeeAllSection />
      <FaqSection />
      <TimerSection />
      <FloatingPet />
    </>
  );
}
