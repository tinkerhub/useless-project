"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Minimal single-stroke icons, one per route - no fill, no color of their own, so they just take
// on whatever text color the row around them has (dark at rest, unchanged on hover/active; the
// row's own font-weight is what marks the current page, nothing extra layered on top of it).
function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V10.5Z" />
    </svg>
  );
}
function IconBook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5V4.5Z" />
      <path d="M4 19a2.5 2.5 0 0 1 2.5-2.5H20" />
    </svg>
  );
}
function IconTrophy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v1a4 4 0 0 0 4 4M17 5h3v1a4 4 0 0 1-4 4" />
      <path d="M12 14v3M9 21h6M8.5 21c0-2 1-3 3.5-3s3.5 1 3.5 3" />
    </svg>
  );
}
function IconUpload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx={12} cy={12} r={8.5} />
      <path d="M12 7.5V12l3 2.2" />
    </svg>
  );
}
function IconPixel(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" {...props}>
      <rect x={4} y={4} width={6} height={6} />
      <rect x={14} y={4} width={6} height={6} />
      <rect x={4} y={14} width={6} height={6} />
      <rect x={14} y={14} width={6} height={6} fill="currentColor" stroke="none" />
    </svg>
  );
}

const ROUTES = [
  { href: "/", label: "home", Icon: IconHome },
  { href: "/handbook", label: "handbook", Icon: IconBook },
  { href: "/competitions", label: "competitions", Icon: IconTrophy },
  { href: "/submissions", label: "submissions", Icon: IconUpload },
  // Links straight to the gallery - that's the default landing spot for "creatures," with the
  // editor (still at /creatures) reachable only from the gallery's own "draw your own" button.
  // activeMatch stays the broader /creatures so the nav row still highlights while drawing, even
  // though the link itself skips past that page.
  { href: "/creatures/gallery", activeMatch: "/creatures", label: "creatures", Icon: IconPixel },
  { href: "/timer", label: "timer", Icon: IconClock },
];

// Lives in the root layout (not per-page like HandbookButton used to be), so it's the one
// consistent way to get from any page to any other - the individual "back" pills that used to sit
// on each page only ever pointed at their immediate parent, not the whole site.
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);

  // Closes on an outside click or Escape, same as any other dismissible dropdown.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    // Sits just under Splash's z-[60] loading overlay, so the site's brief splash screen still
    // covers it - it should only appear once there's actually a page underneath to navigate.
    <div ref={rootRef} className="fixed top-3 right-3 z-[55] md:top-8 md:right-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="font-nanum-pen flex cursor-pointer items-center justify-center rounded-full bg-black/80 px-4 py-2 text-[16px] text-white backdrop-blur transition-transform duration-200 ease-out hover:-translate-y-0.5 select-none md:px-5 md:py-2.5 md:text-[19px]"
      >
        {open ? "close" : "menu"}
      </button>

      {open && (
        // A plain list - one row per page, each row just an icon and a label and nothing else.
        // The current page is marked by its own row's weight, not by any added dot or ring.
        <nav
          aria-label="Site"
          className="animate-nav-pop absolute top-full right-0 mt-2 flex w-[190px] flex-col overflow-hidden rounded-xl border border-black/10 bg-white py-1.5 shadow-lg"
        >
          {ROUTES.map(({ href, activeMatch, label, Icon }) => {
            const matchAgainst = activeMatch ?? href;
            const active = matchAgainst === "/" ? pathname === "/" : pathname.startsWith(matchAgainst);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`font-nanum-pen flex items-center gap-3 px-4 py-2.5 text-[18px] leading-none transition-colors hover:bg-black/5 ${
                  active ? "text-[#0e0e0d]" : "text-[#33322f]"
                }`}
              >
                <Icon className="size-[18px] shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
