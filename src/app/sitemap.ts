import type { MetadataRoute } from "next";
import { EDITION_PAGES, editionHome, editionPath, liveEditions } from "@/lib/editions";

const SITE = "https://useless.tinkerhub.org";
const PROGRAM_PAGES = ["/", "/editions", "/projects", "/creatures/gallery", "/timer"];

export default function sitemap(): MetadataRoute.Sitemap {
  const editionPages = liveEditions().flatMap((edition) => [
    // The current edition's home is "/", already listed above.
    ...(editionHome(edition.slug) === "/" ? [] : [editionPath(edition.slug)]),
    ...EDITION_PAGES.filter((page) => edition.pages[page]).map((page) => editionPath(edition.slug, page)),
  ]);

  return [...PROGRAM_PAGES, ...editionPages].map((path) => ({
    url: path === "/" ? SITE : `${SITE}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
