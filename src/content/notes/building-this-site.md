---
title: Building a home on the web
description: Professional work, personal projects, and an ice-blue home on the web.
date: 2026-10-03
---

This site connects two sides of my work: professional business solutions and personal software projects. The public portfolio links to real GitHub repositories, while the lab is a separate space for browser experiments.

## Static first

Astro builds the pages into HTML. Most of the site needs no browser JavaScript. The theme switch and the flow-field experiment are small exceptions: they run directly in the browser without a backend.

Identity, projects, and service links live in TypeScript data files. Notes are Markdown files. Adding content doesn't require a database or an admin server.

## One identity, two themes

The logo combines initials and code braces with mountains, a trail, and trees. The full artwork keeps the name and “Build • Solve • Explore • Repeat.” A text-free emblem fits the shared header.

Transparent dark-ink and frost-white versions let the same artwork sit on light and dark backgrounds. The default theme is deep navy with electric-blue accents; the theme switch selects a frost-light alternative and remembers that choice locally. Both logo versions preserve the shape and distressed texture of the supplied artwork.

## One more container

The Docker build produces a static site served by nginx. An existing reverse proxy can route the root domain to this container while leaving Plex and other subdomains alone. TLS belongs at that proxy.

## A directory, not a security boundary

The homelab page shows SOL's real services — logos, roles, and how they connect — without publishing a single private address. It isn't a dashboard, and excluding it from search engines does not restrict access. Authentication and access rules belong on the services themselves or at the reverse proxy.

## Room to play

Two experiments so far: a canvas flow field and a generative topographic map with a trail winding through it. Press ⌘K (or Ctrl+K) anywhere to jump between pages, projects, and services. The lab can keep growing independently of the portfolio.
