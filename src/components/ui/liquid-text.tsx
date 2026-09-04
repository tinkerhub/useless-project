//@ts-nocheck
"use client";

import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const morphTime = 1.5;
// How long a settled text holds still before morphing to the next one - timer-app.tsx's
// MORPH_PASS_MS/MORPH_COOLDOWN_MS mirror this value exactly (their comments explain why), so
// don't change this here without updating those too.
const cooldownTime = 1;

const useMorphingText = (texts: string[]) => {
  const textIndexRef = useRef(0);
  const morphRef = useRef(0);
  const cooldownRef = useRef(0);
  const timeRef = useRef(new Date());

  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);

  const setStyles = useCallback(
    (fraction: number) => {
      const [current1, current2] = [text1Ref.current, text2Ref.current];
      if (!current1 || !current2 || !texts || texts.length === 0) return;

      current2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      current2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      const invertedFraction = 1 - fraction;
      current1.style.filter = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`;
      current1.style.opacity = `${Math.pow(invertedFraction, 0.4) * 100}%`;

      current1.textContent = texts[textIndexRef.current % texts.length];
      current2.textContent = texts[(textIndexRef.current + 1) % texts.length];
    },
    [texts],
  );

  const doMorph = useCallback(() => {
    morphRef.current -= cooldownRef.current;
    cooldownRef.current = 0;

    let fraction = morphRef.current / morphTime;

    if (fraction > 1) {
      cooldownRef.current = cooldownTime;
      fraction = 1;
    }

    setStyles(fraction);

    if (fraction === 1) {
      textIndexRef.current++;
    }
  }, [setStyles]);

  const doCooldown = useCallback(() => {
    morphRef.current = 0;
    const [current1, current2] = [text1Ref.current, text2Ref.current];
    if (current1 && current2) {
      current2.style.filter = "none";
      current2.style.opacity = "100%";
      current1.style.filter = "none";
      current1.style.opacity = "0%";
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const newTime = new Date();
      const dt = (newTime.getTime() - timeRef.current.getTime()) / 1000;
      timeRef.current = newTime;

      cooldownRef.current -= dt;

      if (cooldownRef.current <= 0) doMorph();
      else doCooldown();
    };

    animate();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [doMorph, doCooldown]);

  return { text1Ref, text2Ref };
};

interface MorphingTextProps {
  className?: string;
  style?: React.CSSProperties;
  texts: string[];
}

const Texts: React.FC<Pick<MorphingTextProps, "texts">> = ({ texts }) => {
  const { text1Ref, text2Ref } = useMorphingText(texts);
  return (
    <>
      {/* Centered (not just pinned to the top) so a wrapped multi-line text and a short
          single-line one both land in the middle of whatever box this sits in, rather than a
          short text sitting high with empty space below it. */}
      <span
        className="absolute inset-0 flex w-full items-center justify-center text-center"
        ref={text1Ref}
      />
      <span
        className="absolute inset-0 flex w-full items-center justify-center text-center"
        ref={text2Ref}
      />
    </>
  );
};

const SvgFilters: React.FC = () => (
  <svg id="filters" className="hidden" preserveAspectRatio="xMidYMid slice">
    <defs>
      {/* The default SVG filter region (-10%/120% of the filtered element's own box) clips this
          filter's blur well before it reaches its max radius, since that box is short and wide
          (a line of text) while the blur is large and radiates in every direction - the result
          reads as a hard-edged smear instead of the intended soft gooey merge. Widened generously
          here so the blur always has room regardless of how large the text or its blur gets. */}
      <filter id="threshold" x="-100%" y="-300%" width="300%" height="700%">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 255 -140"
        />
      </filter>
    </defs>
  </svg>
);

const MorphingText: React.FC<MorphingTextProps> = ({ texts, className, style }) => (
  // Sizing (height, font-size, weight) is left entirely to `className`/`style` rather than
  // defaulted and then fought with overrides here - a consumer's breakpoint-scoped override
  // (e.g. a plain `text-[...]` up against this component's own `lg:text-[...]`) wouldn't
  // reliably win over a hardcoded default at that same breakpoint, which is exactly the kind of
  // mismatch that made a caller's chosen size not actually stick everywhere it needed to.
  <div
    className={cn(
      "relative mx-auto w-full max-w-screen-md text-center [filter:url(#threshold)_blur(0.3px)]",
      className,
    )}
    style={style}
  >
    <Texts texts={texts} />
    <SvgFilters />
  </div>
);

export { MorphingText };
