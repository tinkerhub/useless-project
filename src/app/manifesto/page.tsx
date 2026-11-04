import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Manifesto · Useless Projects",
  description: "Why Useless Projects exists - a note from the curator on making space to create without the pressure to be useful.",
};

const PARAGRAPHS = [
  "In a world chasing results, we paused to ask - what if we made space for students to create without the pressure to be “useful”? That’s how Useless Projects was born. A name that made people laugh, wonder, and then get curious enough to build.",
  "This initiative wasn’t about big ideas or polished outcomes. It was about courage.",
  "What emerged was magical. Scrappy prototypes. Ridiculous ideas. And most importantly, students who dared to begin. One participant, barely weeks into college, built her first hardware project by morning. That spark? That’s what we’re here to ignite.",
  "Because before innovation, there is imagination. Before skill, there is play. And before impact, there is belief.",
  "Useless Projects returns with the same spirit - to remind young people that it’s okay to play, to mess up, to dream without a roadmap. Because in those moments of low stakes and high courage, something real is sparked.",
  "We invite you to be part of it - as a host, a partner, a believer in the power of messy, joyful making.",
];

export default function ManifestoPage() {
  return (
    // data-page opts out of the home page's scroll snapping (see globals.css) - a note you read
    // top to bottom, nothing else on the page.
    <main data-page="handbook" className="flex min-h-svh w-full flex-col items-center bg-white px-5 text-[#0e0e0d] sm:px-8">
      <article className="flex w-full max-w-[640px] flex-col items-start gap-10 py-24 text-left sm:py-32">
        <h1 className="font-drowner leading-[0.9]" style={{ fontSize: "clamp(56px, 12vw, 112px)", letterSpacing: "0.02em" }}>
          manifesto
        </h1>

        {/* What the thing is, before the why - for whoever lands here without having seen the
            rest of the site. Reads as the letter's opening line rather than a box of its own. */}
        <p className="font-nanum-pen text-[26px] leading-[1.35] text-[#0e0e0d] sm:text-[32px]">
          Useless Projects is an 18-hour overnight make-a-thon where you build whatever you want - because making
          things doesn&apos;t always have to be about making something useful.
        </p>

        <div className="flex flex-col gap-6">
          {PARAGRAPHS.map((text, i) => (
            <p key={i} className="font-nanum-pen text-[22px] leading-[1.45] text-[#33322f] sm:text-[26px]">
              {text}
            </p>
          ))}
        </div>

        <p className="font-nanum-pen text-[24px] leading-none text-[#244638] sm:text-[28px]">- Kurian Jacob, Curator</p>
      </article>

      <footer className="flex w-full max-w-[640px] flex-col items-start gap-4 border-t border-black/10 py-16 text-left">
        <p className="font-helvetica text-[11px] tracking-[0.18em] text-[#33322f]/55 uppercase">an initiative by</p>
        <a
          href="https://tinkerhub.org"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="TinkerHub Foundation"
          className="transition-opacity hover:opacity-70"
        >
          <Image src="/tinkerhub-foundation.svg" alt="TinkerHub Foundation" width={200} height={64} />
        </a>
      </footer>

      <p className="font-nanum-pen w-full max-w-[640px] pb-24 text-center text-[20px] leading-[1.4] text-[#33322f]/75">
        This whole program - its format, its designs, everything - is free to replicate. Take it, run it, make it yours.
      </p>
    </main>
  );
}
