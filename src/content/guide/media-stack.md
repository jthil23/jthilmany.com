---
title: Building a legal media stack
description: See how media libraries, request tools, automation, and download clients can fit together—with rights and safety first.
order: 8
---

A media stack is a group of apps that organize and play media. Each app has a specific job, and the system is easier to maintain when you understand where its files move. This chapter describes a general arrangement, not a promise that every tool is necessary or that every source is lawful.

## The pieces

Plex Media Server indexes a library and streams its contents to compatible clients. It can sometimes transcode media—convert it during playback when the device cannot play the original format. Hardware transcoding support depends on the platform, file, client, and Plex configuration.

Seerr provides a request interface for users to ask for titles. Sonarr manages television series and Radarr manages films; each can monitor configured sources and organize files. Prowlarr manages indexer connections and can share them with other automation tools. Download clients such as NZBGet or qBittorrent transfer files. A VPN container may route selected traffic through a VPN provider, but networking it correctly is the operator's responsibility. A VPN does not make unlawful downloading lawful, and it does not guarantee anonymity or prevent every leak.

## Be deliberate about rights

Only download or distribute content that you have the rights to access. Copyright law and permitted uses differ by country and situation; do not assume that a tool, indexer, VPN, or private tracker grants permission. Use the stack with legitimate media sources, such as your own discs where local law permits, purchases that allow the intended use, public-domain works, or appropriately licensed content. The rights and terms of a source are your responsibility to check.

Do not configure automation to search indiscriminately. Understand each source, follow its terms, and restrict access to the request interface. A request tool is not an authorization check for content rights.

## Plan files and mounts

Before connecting the apps, decide on a simple directory structure for downloads and the final library. Configure paths consistently across the download client and library managers so files can be imported or moved as intended. Mount only the folders each container needs. Avoid giving a media app access to unrelated files or administrator credentials.

Test with a small legal sample. Confirm that the download client can write to its designated location and that the manager can read it. Then check that Plex sees the organized file and that playback works on the devices you care about. Back up configuration folders and document the paths. Databases, metadata, and settings may take time to recreate even if the media can be re-imported.

## Keep the moving parts understandable

Start with the playback server and a small library. Add a request app or automation only if it solves a real problem. Updates can change database formats, API behavior, and recommended configuration; check each project's documentation before upgrading. Do not assume that all containers share the same network or that routing one client through a VPN routes every app through it.

<aside class="on-sol" aria-label="On SOL">
<p><strong>On SOL</strong></p>
<p>SOL's media stack: Plex for watching, Seerr for requests, Sonarr and Radarr to track shows and movies, Prowlarr to manage indexers, and NZBGet and qBittorrent as download clients, with qBittorrent routed through a Gluetun VPN container. Bazarr, Kometa, and Tdarr handle subtitles, collections, and transcoding.</p>
</aside>

## Next steps

- Begin with media you are authorized to use and one playback client.
- Map download and library directories before connecting automation.
- Confirm the VPN's routing and leak protections from its own documentation.
- Restrict request and management tools to people who should use them.

## Official documentation

- [Plex Media Server](https://support.plex.tv/articles/200264746-quick-start-step-by-step-guides/)
- [Seerr documentation](https://docs.seerr.dev/)
- [Sonarr documentation](https://wiki.servarr.com/sonarr)
- [Radarr documentation](https://wiki.servarr.com/radarr)
- [Prowlarr documentation](https://wiki.servarr.com/prowlarr)
- [qBittorrent project site](https://www.qbittorrent.org/)
- [NZBGet documentation](https://nzbget.com/documentation/)
- [Gluetun documentation](https://github.com/qdm12/gluetun-wiki)
