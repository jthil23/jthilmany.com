// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://jthilmany.com",
  output: "static",
  trailingSlash: "ignore",
  integrations: [
    sitemap({
      // The homelab dashboard is for you, not search engines.
      filter: (page) => !page.includes("/homelab"),
    }),
  ],
});
