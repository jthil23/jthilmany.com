---
title: Docker containers, explained
description: Understand images, containers, volumes, ports, and the two common ways to configure apps.
order: 5
---

Docker is a way to package and run applications in containers. A container is an isolated running process with the files and dependencies it needs, while sharing the host operating system's kernel. This makes an application easier to install and replace than manually mixing its files into the server, but it does not make the app magically secure or its data automatically safe.

## Images and containers

An image is a packaged template for an application. A container is a running instance created from that image, with configuration and runtime state. You can remove and recreate a container from an updated image, but anything stored only in the container's writable layer may disappear when it is replaced. This is why persistent data needs an explicit storage location.

A volume or bind mount connects a path inside a container to storage managed outside that disposable container. For example, an app might store its database in a mounted configuration directory. The exact paths depend on the image's documentation. Know which folders contain persistent data before updating or deleting anything; back them up separately.

## Ports and access

A network port is a numbered endpoint used by applications to communicate. A container can expose a port internally, and the host can publish a selected port so devices can reach it. Publishing a port broadly can make a service reachable beyond the intended network, depending on firewall and router settings. Do not publish an administration interface to the public Internet just because the install form offers a port field. Prefer local access or a deliberately configured private access method.

Containers can also share networks and communicate by service name. This can avoid exposing every internal port on the host. Learn the difference between a port inside a container and one published on the host; these numbers can differ.

## Configuration: Compose or templates

Docker Compose describes one or more related services in a YAML file. It records images, mounts, environment settings, networks, and dependencies in a repeatable configuration. This makes changes reviewable and easier to recreate. Compose files are instructions, not backups: preserve the configuration and the data it points to.

Unraid provides a web interface and community templates to configure containers. Templates can make common settings easier to enter, but you remain responsible for checking the image source, permissions, mounted paths, update behavior, and network exposure. Avoid copying settings you do not understand. Keep configuration files and secrets out of public repositories.

## Updates and trust

An image tag identifies an image version or channel, but tags may move over time. Read the application's update guidance and keep a record of what changed. Updating can fix bugs and security issues, but it can also change configuration formats or break compatibility. Before major changes, ensure you have a restorable backup of the application's persistent data. Pull images only from a source you trust and verify what privileges the container needs; broad access to the host gives a compromised app more power.

Start with one low-risk service. Identify its image, persistent paths, network exposure, and backup method. Then practice stopping it, updating it, and restoring its data. Those habits matter more than memorizing every Docker command.

<aside class="on-sol" aria-label="On SOL">
<p><strong>On SOL</strong></p>
<p>SOL runs 50+ containers across media, smart home, networking, databases, monitoring, and AI. Every one of them is just an image plus a few settings, which is exactly how you should start: one container at a time.</p>
</aside>

## Next steps

- Read Docker's basic concepts before deploying an app.
- For each container, record image source, mounts, ports, and update plan.
- Back up mounted data, not merely the Compose file or template.
- Keep management interfaces off public networks unless there is a justified, protected design.

## Official documentation

- [Docker overview](https://docs.docker.com/get-started/docker-overview/)
- [Docker Compose overview](https://docs.docker.com/compose/)
- [Unraid Docker documentation](https://docs.unraid.net/)
