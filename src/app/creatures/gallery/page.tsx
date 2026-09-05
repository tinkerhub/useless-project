import type { Metadata } from "next";
import Link from "next/link";
import { listCreatures, type PublicCreature } from "@/lib/creatures";
import { LiveCreaturesProvider } from "./live-creatures";
import GalleryCount from "./gallery-count";
import LiveCreatureSwarm from "./gallery-swarm-live";
import DrawHereBanner from "./draw-here-banner";

export const metadata: Metadata = {
  title: "Creature Gallery · Useless Projects",
  description: "Every pixel creature the community has drawn, all loose in one place.",
};

// Always reflect the latest submissions - the whole point of the page is "what has everyone
// drawn right now," not a cached snapshot.
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const stored = await listCreatures();
  // deviceId only matters for enforcing the per-visitor cap in the submit route - stripped here
  // too, not just in /api/creatures/list, since these props cross the server/client boundary
  // straight into the page's own initial HTML.
  const creatures: PublicCreature[] = stored.map(({ id, name, pixels, createdAt }) => ({ id, name, pixels, createdAt }));

  return (
    // Seeds the client-side poll (see live-creatures.tsx) with what the server already fetched,
    // so the gallery still works the same on first load - the poll only matters for whoever
    // leaves the tab open long enough for someone else to add a creature.
    <LiveCreaturesProvider initialCreatures={creatures}>
      <main data-page="handbook" className="flex min-h-svh w-full flex-col overflow-x-hidden bg-white text-[#0e0e0d]">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-5 pt-14 sm:px-8 sm:pt-20">
          {/* On mobile, DrawHereBanner's corner pill is already the one clear "draw yours" entry
              point (right there under the thumb) - a second button up here would just be a
              duplicate a phone screen has no room for. A desktop visitor's mouse is nowhere near
              that corner by default, and the QR card down there reads as "scan this with your
              phone" rather than "click here" at a glance - so on wider screens the button belongs
              next to the heading, where it's the first thing seen instead of something to notice
              in a corner. */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-drowner leading-[0.95] text-[#0e0e0d]" style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>
              creature gallery
            </h1>
            <Link
              href="/creatures"
              className="font-nanum-pen hidden shrink-0 rounded-full bg-[#0e0e0d] px-6 py-2.5 text-[18px] leading-none text-white shadow-lg transition-transform hover:scale-105 sm:block"
            >
              draw yours
            </Link>
          </div>
          <GalleryCount />
        </div>

        {/* Bounded and centered so the cluster starts in the middle of the visible screen - as
            more creatures pile on and the spiral grows past this box, the overflow is clipped
            rather than blowing out the page's width or height (especially on mobile). */}
        <div className="relative min-h-[60vh] flex-1 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <LiveCreatureSwarm />
          </div>
        </div>

        <DrawHereBanner />
      </main>
    </LiveCreaturesProvider>
  );
}
