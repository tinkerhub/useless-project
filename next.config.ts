import type { NextConfig } from "next";
import { CURRENT_EDITION } from "./src/lib/editions";

// Exact page paths only: redirects run before /public, and /handbook/*.webp and /results/* are
// real files. Temporary (307) because "current" moves every year.
const YEAR_PAGES = ["/handbook", "/competitions", "/submissions", "/results"];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The current edition's home is "/", so its own front door just points there.
      { source: `/${CURRENT_EDITION}`, destination: "/", permanent: false },
      ...YEAR_PAGES.map((source) => ({ source, destination: `/${CURRENT_EDITION}${source}`, permanent: false })),
      { source: "/competitions/:slug", destination: `/${CURRENT_EDITION}/competitions/:slug`, permanent: false },
    ];
  },
};

export default nextConfig;
