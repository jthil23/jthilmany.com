# jthilmany.com

Jeff's personal site, built with Astro and TypeScript and published as static HTML. Pages: home (mountain-trail hero, SOL stats, service-logo marquee, bento of work and projects), `/work` (professional focus), `/projects` (illustrated feature rows for each repository), `/homelab` (SOL: server identity, interactive service constellation, animated media and smart-home pipelines, full service directory), `/lab` (Topo trail, Racing line, and Request flow experiments), `/guide` (a ten-chapter beginner home-server guide), `/radar` (build-time headlines from public RSS/Atom feeds), Markdown notes, and an "Off trail" 404. There is no application server, service discovery, monitoring backend, or live service-status polling.

This repository is the implementation; the commands and examples below are a maintenance and deployment reference, not a list of implementation work Jeff needs to complete. Hosting examples describe alternatives, not claims about infrastructure that already exists.

## Local development

Use **Node.js 22.12.0 or newer** and npm. `.nvmrc` selects Node 22 for tools that support it.

```sh
npm ci
npm run dev
```

Astro's development server normally serves `http://localhost:4321`. The scripts are:

```sh
npm run check       # Astro / TypeScript diagnostics
npm test            # Node test runner for src/**/*.test.ts (pathfinding logic)
npm run build       # Diagnostics, then a production static build in dist/
npm run preview     # Preview an existing build locally; not a production server
```

For an explicit loopback preview address:

```sh
npm run preview -- --host 127.0.0.1 --port 4321
```

### Local verification

The production build passes Astro diagnostics with zero errors, warnings, or hints and generates 23 HTML pages; `npm test` passes. Browser checks on the production build covered: every route at 1366 px and 390 px with no horizontal overflow, no broken images, and no console errors; both themes; the mobile header nav as a single swipeable row; Topo trail generated and real-terrain presets, routeable default endpoints, Compare, and the 3D view; Racing line track-of-the-week selection, headless training to a completed simulated lap, and the ideal-line overlay; all four Request flow scenarios; guide chapter navigation; Radar topic filtering and a failing feed rendering as unavailable; reduced motion pausing experiments until the visitor presses Play.

Compose configuration validation passes. The Docker image itself is unverified locally (no Docker daemon on the development Mac); the live site is served by GitHub Pages instead (see below).

`astro.config.mjs` sets the canonical site URL to `https://jthilmany.com`. Change it if the canonical domain changes; it is also used for the sitemap. The site builds for the domain root, not an arbitrary subdirectory. Static content changes require a rebuild and redeployment.

## Live deployment (GitHub Pages)

The public site is built and published by `.github/workflows/deploy.yml` on every push to `main` of [jthil23/jthilmany.com](https://github.com/jthil23/jthilmany.com): Node from `.nvmrc`, `npm ci`, `npm run build` (diagnostics + build), then `actions/upload-pages-artifact` and `actions/deploy-pages`. Actions are pinned to full commit SHAs, the workflow grants only the permissions needed by each job, and checkout does not persist its token. Dependabot checks GitHub Actions and npm dependencies weekly. The Pages source is "GitHub Actions"; the custom domain is `jthilmany.com` (`public/CNAME` is shipped too) with HTTPS enforced. GitHub serves `404.html` for unknown routes.

The same workflow also runs on a schedule (`17 */6 * * *`, about every six hours) so `/radar` refreshes its build-time feed snapshot and the Racing line calendar stays current. GitHub automatically disables scheduled workflows in public repositories after 60 days without repository activity ([events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)); if that happens, re-enable it from the Actions tab ([disabling and enabling workflows](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)). It can also be run manually (`workflow_dispatch`).

Cloudflare DNS for `jthilmany.com` (all DNS-only, not proxied):

| Record | Value | Purpose |
| --- | --- | --- |
| `A jthilmany.com` | 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 | GitHub Pages (public) |
| `AAAA jthilmany.com` | 2606:50c0:8000::153 … 8003::153 | GitHub Pages over IPv6 |
| `CNAME www` | `jthil23.github.io` | Redirects to the apex |
| `A *.jthilmany.com` | 192.168.1.3 | Nginx Proxy Manager on SOL — LAN/Tailscale-only services |

The wildcard used to be a CNAME to the apex; it was converted to its own `A` record **before** the apex moved, so every service subdomain still lands on Nginx Proxy Manager, whose access list only admits the LAN and Tailscale. A JSON backup of the previous records is on SOL in `/mnt/user/appdata/jthilmany-site-dns-backup/`. To roll back, restore the apex `A` to `192.168.1.3` and remove the GitHub `A`/`AAAA`/`www` records.

The self-hosted container setup below remains an alternative (for example, behind a Cloudflare Tunnel, which needs a token with Tunnel permissions; the current DNS-only token cannot create one).

## Approved branding

The supplied JT/code-braces/mountain artwork is used without a vector redraw. `public/brand/` contains the transparent raster logo and emblem variants, optimized at display-sized widths for 1x and 2x screens. The distressed texture is preserved as transparency. `src/components/BrandLogo.astro` (`variant: 'full' | 'emblem'`) renders the inverted artwork in the default dark theme and the original-ink artwork in the light theme using responsive `srcset` images. `public/og-card.jpg` is the 1200 × 630 social preview, composed in the site's dark brand style with the inverted emblem and site tagline.

`public/favicon.png` and `public/apple-touch-icon.png` are square, text-free emblem exports. These are raster assets from the supplied image, not scalable vector originals.

## Theme

The default theme is deep navy with hyper-blue (`#2563FF`) and ice-blue accents, defined in `src/styles/global.css`. The header toggle switches to a frost-light theme and stores the choice in `localStorage`; the site does not follow the operating-system color preference.

## Interaction features

- **Command palette** (`src/components/CommandPalette.astro`, included in `Base.astro`): ⌘K / Ctrl+K or the header search button. Searches pages, project repositories, and every service (opens its `/homelab#<slug>` entry); actions toggle the theme and copy the site URL. Any element with `data-open-palette` opens it.
- **Scroll reveal**: add class `reveal` to any element. Content is visible without JavaScript and under reduced motion; only elements that start offscreen animate in.
- **Sticky header** becomes translucent with a blur after scrolling.
- **Visual effects**: native cross-document view transitions between pages (`@view-transition`, no router); an animated aurora and drifting ice crystals in the homepage hero (`src/components/fx/Snowfall.astro`); a pointer-following glow on `.card` / `[data-glow]` elements (fine pointers only); a scroll-progress hairline on the header; button sheen and animated nav underlines.
- **Easter eggs**: the Konami code (↑↑↓↓←→←→BA) triggers a full-page flurry and a "Let it snow ❄" toast; anything can trigger the flurry with `window.dispatchEvent(new CustomEvent('jt:snow'))`. The browser console shows a JT greeting.
- All animation (parallax, aurora, snow, marquee, pipelines, count-ups, terminal typing, trail drawing, view transitions) stops under `prefers-reduced-motion`.

## Lab experiments

All three run entirely in the browser; nothing is sent to a server.

- **Topo trail** (`src/pages/lab/topo-trail.astro`, `src/lib/topo/`): plan a trail over seeded generated terrain (domain-warped fBm + ridged noise, erosion, lakes) or real elevation from [Terrain Tiles on AWS Open Data](https://registry.opendata.aws/terrain-tiles/) (Terrarium PNGs fetched by the visitor's browser). Dijkstra, A*, and greedy best-first search run in a Web Worker over an 8-connected grid with a maximum-grade constraint; Compare shows explored cells, time, length, gain, and max grade. The 3D view lazy-loads `three` only when opened. Real-terrain attribution is shown on the page and printed on PNG exports. Maps are for visualization, not navigation.
- **Racing line** (`src/pages/lab/racing-line.astro`, `src/lib/f1/`, `src/data/f1/`): a population of simulated cars with small neural networks learns a Formula 1 circuit by neuroevolution, compared with a computed minimum-curvature ideal line. Circuit outlines are modified from Tomislav Bacinger's [f1-circuits](https://github.com/bacinger/f1-circuits) (MIT; full text in `src/data/f1/LICENSE-f1-circuits.txt`). The season calendar is fetched at build time from the [Jolpica F1 API](https://api.jolpi.ca/ergast/f1/) with a committed `calendar-2026.json` fallback; "track of the week" is chosen in the browser from the visitor's date. Physics are simplified and all times are simulated.
- **Request flow** (`src/pages/lab/request-flow.astro`, `src/data/flows.ts`): four illustrated paths through SOL (media request, camera motion, local voice, remote access) built from the public service inventory. It does not connect to SOL or show live traffic.

## Content reference

Content is kept in the repository rather than fetched from a private API:

- `src/data/site.ts`: the `site` object contains `name`, `domain`, `tagline`, `description`, `about`, and `socials` (`label` and `url`; currently GitHub and LinkedIn). Socials render on the homepage and in the footer. Keep identity, biography, and links factual.
- `src/data/projects.ts`: the `projects` list uses `title`, `description`, `tags`, optional `href`, and `featured`. It currently lists three original GitHub repositories (Command Center, Main Scraper, F1 Dashboard); descriptions describe source code, not deployed services. Forks are intentionally excluded. A project without a real public destination can omit `href`.
- `src/pages/work.astro`: professional focus. It intentionally contains no workplace case studies, dates, or confidential details; add those only from supplied material.
- `src/data/services.ts`: the SOL inventory, taken from the live container list and Nginx Proxy Manager hosts on the server. Exports `server` (verified hardware facts), `categories`, `services` (`slug`, `name`, `icon`, `category`, `description`), `mediaPipeline`, `smartHomePipeline`, and `serviceBySlug`. Services have no external links; the constellation and command palette lead to their homelab directory entries. Logos live in `public/icons/services/` with the upstream Apache-2.0 `LICENSE` and a `NOTICE.md` listing sources. Private IPs, ports, and keys are never included.
- `src/content/notes/*.md`: add or edit Markdown notes with `title`, `description`, and `date` frontmatter. The filename provides the note slug.
- `src/content/guide/*.md`: home-server guide chapters with `title`, `description`, `order`, and optional `updated` frontmatter. `/guide` lists chapters by `order` with reading times; chapter pages have a table of contents and previous/next navigation. Keep "On SOL" asides consistent with `src/data/services.ts`.
- `src/data/feeds.ts`: `/radar` feed list (`id`, `label`, `topic`, `url`, `homepage`). `src/lib/feeds.ts` fetches and parses them at build time with per-feed timeouts; a failing feed is logged and skipped, never failing the build. Only headlines, source, time, and outbound links are shown.

For example, a note named `src/content/notes/a-real-note.md` has this shape:

```md
---
title: "A real note"
description: "A brief summary of this note."
date: 2026-10-03
---

The note's Markdown content goes here.
```

Only publish actual writing; this example is a format reference, not prewritten site content. Everything included in the generated site should be treated as public information. Do not put credentials, tokens, confidential addresses, or secrets in data files, Markdown, browser code, or build-time environment variables.

## Container deployment

The multi-stage `Dockerfile` installs locked dependencies and builds with `node:22-alpine`, then copies only `dist/` and `nginx.conf` into an `nginx:alpine` runtime. The runtime serves HTTP on port 80; TLS and authentication belong at the fronting proxy.

```sh
docker compose up -d --build
```

The default published address is **`127.0.0.1:8080:80`**. A proxy running directly on that same host can use `http://127.0.0.1:8080`. This does not expose a listener on every host interface.

Both host binding and port are configurable using shell variables or a local `.env` file:

```dotenv
SITE_BIND_ADDRESS=127.0.0.1
SITE_PORT=8080
```

For example:

```sh
SITE_PORT=8081 docker compose up -d --build
```

Keep the loopback binding unless an actual deployment requires otherwise. `0.0.0.0` would expose the origin on all host interfaces; it is not necessary for a containerized proxy on a shared Docker network. Do not publish port 80 directly over the Internet as a substitute for TLS and access controls.

Operational reference commands:

```sh
docker compose logs --follow site
docker compose up -d --build   # Rebuild and replace the site after content changes
docker compose down           # Stop and remove this Compose deployment
```

### Static routing, caching, and headers

Nginx resolves an exact file, then a directory's `index.html`, then a matching `.html` file. Unknown routes serve the generated `404.html` with an actual **404** status, rather than returning the homepage with status 200. There is no SPA catch-all.

Only successful files under `/_astro/` with a fingerprinted filename (`name.<8-or-more-character-hash>.<asset-extension>`) receive `public, max-age=31536000, immutable`. HTML, other files, and error responses use `no-cache`, allowing clients to revalidate after a deployment. Gzip is enabled for supported text formats; responses also carry `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy` headers. TLS policy, including HSTS when appropriate, is the HTTPS proxy's responsibility.

**Validation limitation:** a Docker daemon is unavailable in the local development environment. The Docker image build, nginx runtime behavior, proxy examples, and a live deployment have not been validated there. These configuration files are not evidence of a proven deployment. With a Docker-capable host, validate the Compose configuration, build the image, and check the runtime before exposing it:

```sh
docker compose config
docker compose build
docker compose up -d
curl -I http://127.0.0.1:8080/
curl -I http://127.0.0.1:8080/projects
curl -I http://127.0.0.1:8080/this-route-does-not-exist
```

The last request should return 404. Check an actual generated `/_astro/` asset for the immutable header and check the proxy's HTTPS and authentication behavior separately. Substitute `SITE_PORT` if it is changed.

## Root-domain DNS

Serve this site at **`jthilmany.com`** without changing the destinations of existing subdomains.

- For a conventional reverse proxy, update only the apex (`@`) A record to the actual proxy's public IPv4 address. Publish an apex AAAA record only if IPv6 reaches the same correctly configured proxy; an old AAAA record can send some visitors to the wrong origin.
- Point DNS to the public proxy, not a Docker network address, LAN address, or loopback address. Route the `jthilmany.com` host at the proxy to this site's origin and issue an appropriate TLS certificate.
- For Cloudflare Tunnel, use the public-hostname DNS record created for the actual tunnel instead of an A record to a private origin. Resolve conflicting apex A/AAAA/CNAME records for this hostname only; Cloudflare can flatten an apex CNAME.
- Preserve existing subdomain records, MX records, TXT records, and other unrelated DNS entries. Do not replace the zone, use a wildcard record, or change nameservers just to add this site. If moving DNS providers for a chosen deployment, migrate and verify the entire existing zone first.
- `www` is optional. If used, give it its own DNS entry and proxy redirect to the canonical apex; do not assume it already exists.

A proxied DNS record does not itself configure origin routing or authentication. DNS and certificate propagation may take time; confirm the selected origin rather than assuming publication succeeded.

## Containerized proxies: shared network, not localhost

Inside a proxy container, `127.0.0.1` refers to **that proxy container**, not the Docker host or this site's container. For Nginx Proxy Manager, Caddy, Traefik, or `cloudflared` running as containers, attach the proxy and this service to the same external Docker network and use **`http://jthilmany-site:80`** as the origin.

Use an existing suitable proxy network, or create one if needed:

```sh
docker network create proxy
```

An optional local override named `compose.proxy.yml` can attach this deployment:

```yaml
services:
  site:
    networks:
      proxy:
        aliases:
          - jthilmany-site

networks:
  proxy:
    external: true
    name: ${PROXY_NETWORK:-proxy}
```

Start with the override explicitly:

```sh
docker compose -f docker-compose.yml -f compose.proxy.yml up -d --build
```

Set `PROXY_NETWORK` to the real existing network name if different. Declare that same external network in the proxy's own Compose configuration and attach its service. The unique alias avoids relying on a generic `site` service name across deployments. The loopback host port can remain for local diagnostics; container-to-container traffic uses port 80 on the shared network. These examples require the containers to run on the same Docker host/network; a proxy on another machine needs a deliberately reachable and protected origin instead.

### Nginx Proxy Manager

For a containerized NPM on the shared external network, create a Proxy Host with:

- Domain: `jthilmany.com`
- Scheme: `http`
- Forward hostname: `jthilmany-site`
- Forward port: `80`
- SSL: request/select a certificate for this domain and enable Force SSL after certificate issuance succeeds.

A host-native proxy can instead use `127.0.0.1` and `SITE_PORT`. To require real authentication with NPM, create an Access List with authorization credentials and assign it to the Proxy Host. Do not enable an option that bypasses authentication when an IP allow-rule matches unless that is an intentional policy. Applying this Access List protects the **whole host**, including the public pages; use a deliberate path-specific authentication configuration or another proxy if the public pages must remain open while only `/homelab` is private. Do not assume enabling SSL or “Block Common Exploits” supplies authentication.

### Caddy

For a Caddy container on the shared network, a minimal Caddyfile is:

```caddyfile
jthilmany.com {
    reverse_proxy jthilmany-site:80
}
```

Caddy must have its own persistent certificate storage and the reachability needed for its selected certificate challenge. For a host-native Caddy, replace the upstream with `127.0.0.1:8080` (or the configured host port).

To keep public pages open but require authentication for the homelab route, use a real password hash produced by `caddy hash-password` and replace the example credential below:

```caddyfile
jthilmany.com {
    @homelab path /homelab /homelab/*
    basic_auth @homelab {
        jeff REPLACE_WITH_CADDY_PASSWORD_HASH
    }
    reverse_proxy jthilmany-site:80
}
```

The replacement token is not a usable hash. Store credentials securely and only use Basic authentication over HTTPS. Protect any future private routes with equivalent matchers.

### Traefik

For an existing Traefik proxy on the external network, add labels to the `site` service in the local override. This example assumes the proxy already has an HTTPS entrypoint named `websecure` and a certificate resolver named `letsencrypt`; substitute its actual configured names. Keep `exposedByDefault=false` in the proxy's Docker provider configuration.

```yaml
services:
  site:
    labels:
      traefik.enable: "true"
      traefik.docker.network: "${PROXY_NETWORK:-proxy}"
      traefik.http.routers.jeff-site.rule: "Host(`jthilmany.com`)"
      traefik.http.routers.jeff-site.entrypoints: websecure
      traefik.http.routers.jeff-site.tls: "true"
      traefik.http.routers.jeff-site.tls.certresolver: letsencrypt
      traefik.http.routers.jeff-site.service: jeff-site
      traefik.http.services.jeff-site.loadbalancer.server.port: "80"
      traefik.http.routers.jeff-homelab.rule: "Host(`jthilmany.com`) && (Path(`/homelab`) || PathPrefix(`/homelab/`))"
      traefik.http.routers.jeff-homelab.priority: "100"
      traefik.http.routers.jeff-homelab.entrypoints: websecure
      traefik.http.routers.jeff-homelab.tls: "true"
      traefik.http.routers.jeff-homelab.tls.certresolver: letsencrypt
      traefik.http.routers.jeff-homelab.service: jeff-site
      traefik.http.routers.jeff-homelab.middlewares: jeff-homelab-auth
      traefik.http.middlewares.jeff-homelab-auth.basicauth.usersfile: /etc/traefik/auth/jeff-homelab.htpasswd
```

Create a real htpasswd credential file **outside this repository and its Docker build context**, then mount it read-only at that path **in the Traefik container**, not in the site container. An interactive `htpasswd -cB /your/secure/directory/jeff-homelab.htpasswd jeff` command creates a bcrypt credential when Apache's htpasswd utility is available; replace the example directory with an actual secure location. Do not rerun `-c` on an existing multi-user file because it recreates the file. Without the file and mount, the private router is not a working authentication configuration. Use restrictive host file permissions. Configure HTTP-to-HTTPS redirection at Traefik as appropriate; the site labels do not create entrypoints, resolvers, or redirects.

### Cloudflare Tunnel

A Tunnel avoids publishing the site's origin to the Internet. For a locally managed `cloudflared` configuration, the following is the relevant ingress section, not a complete tunnel/credential configuration:

```yaml
ingress:
  - hostname: jthilmany.com
    service: http://jthilmany-site:80
  - service: http_status:404
```

Use the actual tunnel ID and credentials outside this repository. A containerized `cloudflared` needs the same external network as the site. A host-native `cloudflared` uses `http://127.0.0.1:8080` instead. For a remotely managed tunnel, configure the same public hostname and origin in the Cloudflare dashboard rather than adding local ingress rules. Add the hostname's DNS route using that tunnel's management workflow; do not invent a tunnel UUID or public address.

A Tunnel is connectivity, not authentication. Configure a Cloudflare Access self-hosted application covering the homelab base path and its descendants (for example `jthilmany.com/homelab` and `jthilmany.com/homelab/*`) with an explicit allow policy for the intended identities. Verify both the base route and nested routes. Keep the origin unreachable through another unprotected public listener, which would bypass Access. Never commit tunnel credentials or tokens.

## Homelab privacy and security

The homelab page is marked **`noindex`** and omitted from the generated sitemap. `robots.txt` allows crawlers to fetch the page so they can see that directive. That is a request to cooperative search engines, **not security**: anyone who can reach an unprotected URL can read it. A `noindex` directive does not encrypt content or enforce an identity.

Use genuine authentication at the proxy (such as the examples above) if the page should be private. Configure it before publishing private content and test direct-origin bypasses as well as proxy access. The homelab directory is a static showcase, not an access point to SOL's services. The static bundle is not a secret store, and explicit service metadata does not establish authorization or prove uptime.
