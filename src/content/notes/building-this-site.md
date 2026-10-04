---
title: Building a home on the web
description: Professional work, personal projects, and an ice-blue home on the web.
date: 2026-10-03
---

This site connects two sides of my work: professional business solutions and personal software projects. The public portfolio links to real GitHub repositories, while the lab is a separate space for browser experiments.

## Static first

Astro builds the pages into HTML. Most of the site needs no browser JavaScript. The theme switch and the lab experiments are the exceptions: they run directly in the browser without a backend. The radar page's headlines are fetched when the site is built, not by your browser.

Identity, projects, and the homelab service list live in TypeScript data files. Notes and guide chapters are Markdown files. Adding content doesn't require a database or an admin server.

## One identity, two themes

The logo combines initials and code braces with mountains, a trail, and trees. The full artwork keeps the name and “Build • Solve • Explore • Repeat.” A text-free emblem fits the shared header.

Transparent dark-ink and frost-white versions let the same artwork sit on light and dark backgrounds. The default theme is deep navy with electric-blue accents; the theme switch selects a frost-light alternative and remembers that choice locally. Both logo versions preserve the shape and distressed texture of the supplied artwork.

## Hosting

GitHub Pages hosts the site. GitHub Actions builds it on each push to `main`, and Cloudflare DNS points the custom domain to Pages. The Docker build remains an optional self-host alternative: it produces a static site served by nginx.

## A directory, not a security boundary

The homelab page shows SOL's real services — logos, roles, and how they connect — without publishing a single private address. It isn't a dashboard, and excluding it from search engines does not restrict access. Authentication and access rules belong on the services themselves or at the reverse proxy.

## Room to play

Three experiments so far: trail pathfinding across real and generated terrain, AI cars learning a Formula 1 racing line, and an animated walk-through of how requests move through the homelab. Press ⌘K (or Ctrl+K) anywhere to jump between pages, projects, and services. The lab can keep growing independently of the portfolio.
