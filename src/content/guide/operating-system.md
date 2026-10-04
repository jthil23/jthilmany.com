---
title: Picking an operating system
description: Compare Unraid with several common alternatives, and learn what an operating system does for a home server.
order: 3
---

An operating system (OS) is the base software that manages a computer's hardware and gives applications a place to run. Choosing it matters because it shapes storage management, updates, administration, and how you install services. A friendly interface can lower the learning curve, but no interface removes the need to understand what your data and network are doing.

## What Unraid is

Unraid is a commercial operating system aimed at home servers and network-attached storage. It provides a web interface for managing storage and running applications, including Docker containers. Its array approach allows supported drives of different sizes to contribute storage, with one or two parity drives providing a way to reconstruct data after a supported drive failure. Parity is not a backup; chapter 4 explains the distinction.

Unraid is licensed software. Its current licensing terms, trial options, included features, and device limits can change, so check the official pricing and license documentation before buying. A license is part of the total cost, alongside hardware, electricity, replacement disks, and backups. A trial can help assess the interface and compatibility before a long-term commitment.

## Alternatives in brief

TrueNAS is another storage-focused option. Its SCALE product is built around OpenZFS, an advanced storage system that values data integrity and pooled storage. Pool layout and expansion choices are important to plan, so read its storage guidance before creating a pool.

Proxmox Virtual Environment is a virtualization platform: it lets you run virtual machines and containers on a host. It offers flexibility for learning and isolating systems, but may ask you to make more decisions about storage and networking. It is not the same thing as a turnkey NAS operating system.

Plain Linux is a broad family of operating systems rather than a single server product. Debian or Ubuntu Server can be a light, capable base for Docker and other services. You have more control, but commonly take on more command-line administration and assemble more of the management experience yourself.

These are not interchangeable feature lists. Consider how each platform handles your intended storage, what software it supports, how you will update it, and how comfortable you are recovering it after a mistake. Also check hardware compatibility and whether the product's support model suits you.

## Choose for the person who will maintain it

A home server is not a one-time setup. The OS will receive updates, and you will need to understand its backup and recovery story. Read the installation and recovery documentation before moving important files onto it. If possible, test the operating system using spare hardware or noncritical data first.

It is fine to choose the platform with the clearest documentation and a community you can learn from. A more flexible system is not automatically better when your goal is a reliable first project. Keep notes of the decisions you make, especially storage layout and where application data lives. Those notes will matter later if you need to rebuild.

<aside class="on-sol" aria-label="On SOL">
<p><strong>On SOL</strong></p>
<p>SOL runs Unraid: the array, parity, and Docker all live underneath everything else on the server. It's one good choice among several; pick the platform you'll be comfortable maintaining.</p>
</aside>

## Next steps

- Read the current license terms for any paid system before purchase.
- Compare storage requirements and recovery guides, not just feature summaries.
- Try an OS with expendable data before entrusting it with your files.
- Decide how you will record configuration and perform updates.

## Official documentation

- [Unraid product overview](https://unraid.net/product)
- [Unraid documentation](https://docs.unraid.net/)
- [TrueNAS SCALE documentation](https://www.truenas.com/docs/scale/)
- [Proxmox VE documentation](https://www.proxmox.com/en/downloads/proxmox-virtual-environment/documentation)
- [Debian Administrator's Handbook](https://www.debian.org/doc/manuals/debian-handbook/)
- [Ubuntu Server documentation](https://documentation.ubuntu.com/server/)
