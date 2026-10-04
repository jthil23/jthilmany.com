// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://jthilmany.com",
  output: "static",
  trailingSlash: "ignore",
  vite: {
    // three.js (~740 kB raw, ~180 kB gzip) is dynamic-imported only when Topo trail's 3D view opens.
    build: { chunkSizeWarningLimit: 800 },
  },
  integrations: [
    sitemap({
      // The homelab dashboard is for you, not search engines.
      filter: (page) => !page.includes("/homelab"),
    }),
  ],
});
