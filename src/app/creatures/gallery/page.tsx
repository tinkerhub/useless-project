import type { Metadata } from "next";
import Link from "next/link";
import { listCreatures } from "@/lib/creatures";
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
  const creatures = await listCreatures();

  return (
    // Seeds the client-side poll (see live-creatures.tsx) with what the server already fetched,
    // so the gallery still works the same on first load - the poll only matters for whoever
    // leaves the tab open long enough for someone else to add a creature.
    <LiveCreaturesProvider initialCreatures={creatures}>
      <main data-page="handbook" className="flex min-h-svh w-full flex-col overflow-x-hidden bg-white text-[#0e0e0d]">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-5 pt-14 sm:px-8 sm:pt-20">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-drowner leading-[0.95] text-[#0e0e0d]" style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>
              creature gallery
            </h1>
            <Link
              href="/creatures"
              className="font-helvetica w-fit shrink-0 rounded-lg bg-[#0e0e0d] px-4 py-1.5 text-[11px] tracking-[0.08em] text-white uppercase transition-transform hover:scale-105 sm:px-5 sm:py-2 sm:text-[13px]"
            >
              draw your own
            </Link>
          </header>
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
