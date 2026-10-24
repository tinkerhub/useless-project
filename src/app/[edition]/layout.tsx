import { notFound } from "next/navigation";
import { liveEditions, resolveEdition } from "@/lib/editions";

// Only live editions get built; anything else under /<slug> is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return liveEditions().map((edition) => ({ edition: edition.slug }));
}

export default async function EditionLayout({ children, params }: LayoutProps<"/[edition]">) {
  if (!resolveEdition((await params).edition)) notFound();
  return children;
}
