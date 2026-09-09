// The credit line that closes the page. Pinned to the bottom of the timer section rather than
// being a section of its own, so it rides along on the last panel instead of adding another
// screen to a deck that is already one-screen-per-section. It sits below the venue-reveal
// overlay's z-[60], which is fine - that reveal closes itself on a timer (see TimerSection), so
// the footer is only ever covered for the few seconds it runs.
import MadeByOverlay from "./made-by-overlay";

export default function SiteFooter() {
  return (
    <footer className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center px-6 pb-6 text-center">
      <p className="font-nanum-pen text-[13px] leading-none text-[#0e0e0d]/55 lg:text-[15px]">
        <MadeByOverlay /> for useless projects{" "}
        <a
          href="https://tinkerhub.org"
          target="_blank"
          rel="noopener noreferrer"
          // Same magenta underline the FAQ gives its links, so this reads as the site's own link
          // style rather than a browser default sitting at the bottom of the page.
          className="underline decoration-[#ea34df] underline-offset-4 transition-opacity hover:opacity-70"
        >
          @tinkerhub
        </a>
      </p>
    </footer>
  );
}
