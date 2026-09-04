import Link from "next/link";
import QRCode from "qrcode";

// Hardcoded to the production domain (same convention as layout.tsx's metadataBase) rather than
// derived from the request - this gets scanned by a phone on a totally different network than
// whatever is serving the page (a display at the venue), so it always has to point at the real
// site regardless of where the gallery itself happens to be running.
const DRAW_URL = "https://useless.tinkerhub.org/creatures";

// Rendered server-side into plain SVG markup - no external image request at runtime, so this
// keeps working even if the venue's wifi is bad, and it's generated once per page load rather
// than re-fetched from a QR API on every visitor.
export default async function DrawHereBanner() {
  const qrSvg = await QRCode.toString(DRAW_URL, {
    type: "svg",
    margin: 1,
    color: { dark: "#0e0e0d", light: "#ffffff" },
  });

  return (
    // A small corner card rather than a full-width bar - it needs to stay legible from across a
    // room when this is up on a display, but shouldn't eat into the gallery's own space or sit
    // over the crowd of creatures piling toward the center. The QR code only makes sense for a
    // display someone else is looking at across the room - a visitor already on their own phone
    // gets a small button straight to the draw page instead, not a code to scan themselves.
    <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
      <Link
        href="/creatures"
        className="font-helvetica block rounded-full bg-[#0e0e0d] px-4 py-2 text-[11px] tracking-[0.06em] text-white uppercase shadow-lg transition-transform hover:scale-105 sm:hidden"
      >
        draw yours
      </Link>
      <div className="hidden flex-col items-center gap-1.5 rounded-2xl border border-black/10 bg-white/95 p-3 text-center shadow-lg backdrop-blur sm:flex sm:gap-2 sm:p-4">
        <div
          className="size-20 shrink-0 overflow-hidden rounded-md sm:size-28 [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="font-nanum-pen text-[14px] leading-[1.15] text-[#0e0e0d] sm:text-[18px]">draw yours</p>
        <p className="font-helvetica text-[9px] leading-tight font-bold whitespace-nowrap text-[#0e0e0d] sm:text-[11px]">
          useless.tinkerhub.org/creatures
        </p>
      </div>
    </div>
  );
}
