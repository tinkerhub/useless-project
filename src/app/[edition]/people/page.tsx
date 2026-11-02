import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveEdition } from "@/lib/editions";
import PeopleCrowd from "./people-crowd";
import Story from "./story";

export async function generateMetadata({ params }: PageProps<"/[edition]/people">): Promise<Metadata> {
  const edition = resolveEdition((await params).edition, "people");
  return {
    title: "People",
    description: edition ? `The people behind ${edition.title}.` : undefined,
  };
}

export default async function PeoplePage({ params }: PageProps<"/[edition]/people">) {
  const edition = resolveEdition((await params).edition, "people");
  if (!edition) notFound();

  return (
    // data-page sets this page's own scroll snapping (see globals.css): the crowd and the note each
    // fill the screen and snap into place; the story under them scrolls freely.
    <main data-page="people" className="w-full overflow-x-clip bg-white text-[#0e0e0d]">
      <PeopleCrowd heading="h1" edition={edition.slug} />
      <Story />
    </main>
  );
}
