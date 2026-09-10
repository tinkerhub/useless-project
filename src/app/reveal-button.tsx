const REGISTER_URL = "https://tinkerhub.org/events/1M8ORET9A1/useless-projects-3.0";

// The "register here" button - centered under the title in the hero.
// Directs to the official TinkerHub registration page with interactive hover and click feedback.
export default function RevealButton({
  top = 676.5,
  width = 296,
  height = 78,
  fontSize = 37.517,
  lineHeight = 30.44,
}: {
  top?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  lineHeight?: number;
}) {
  return (
    <a
      href={REGISTER_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group absolute left-1/2 flex -translate-x-1/2 cursor-pointer items-center justify-center bg-black text-white shadow-md transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.04] hover:bg-[#1a1a1a] hover:shadow-xl hover:shadow-black/25 active:translate-y-0.5 active:scale-[0.97] active:shadow-inner select-none"
      style={{ top: `${top}px`, width: `${width}px`, height: `${height}px` }}
    >
      <span
        className="flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
        style={{ gap: `${fontSize * 0.24}px` }}
      >
        <span
          className="font-nanum-pen text-center whitespace-nowrap text-white"
          style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` }}
        >
          register here
        </span>
        {/* Drawn rather than typed: Nanum Pen is subset to `latin` (see layout.tsx), which has no
            arrow glyph, so a "→" would silently fall back to another face and sit next to the
            handwriting as a mismatched mark. Round caps/joins keep it in the same marker voice. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-white transition-transform duration-200 ease-out group-hover:translate-x-1"
          style={{ width: `${fontSize * 0.58}px`, height: `${fontSize * 0.58}px` }}
          aria-hidden="true"
        >
          <path d="M4 12h14" />
          <path d="M12.5 6.5 18 12l-5.5 5.5" />
        </svg>
      </span>
    </a>
  );
}
