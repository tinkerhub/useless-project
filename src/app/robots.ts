import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // No disallow entry for the admin route - robots.txt is public, so listing a path there would
    // publish the very URL we're trying to keep unguessable. The page's own noindex meta tag
    // (see admin page metadata) keeps well-behaved crawlers from indexing it without the leak.
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://useless.tinkerhub.org/sitemap.xml",
  };
}
