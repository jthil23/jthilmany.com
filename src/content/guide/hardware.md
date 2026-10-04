---
title: Choosing hardware that fits
description: Match a first server to the work it must do, while accounting for electricity, noise, and future maintenance.
order: 2
---

The right server is not the most powerful server. It is the least complicated machine that can do the jobs you actually plan to run. A clear workload helps you avoid paying for capacity you do not need, and it makes the trade-offs easier to understand before you buy.

## Start with the workload

Write down the jobs you want to run at first: file storage, a few web apps, media playback, or perhaps local AI experiments. Then consider whether those jobs must run simultaneously. A machine storing files and serving a few lightweight apps has different needs from one converting several video streams or running large machine-learning models.

A central processing unit (CPU) executes general instructions. More cores can help when many tasks run at once, but a high core count is not a universal shortcut: individual applications have their own needs. Memory (RAM) holds the working data of running programs. Too little can cause slowdowns or failures; more RAM helps only if the workload uses it. Check the operating system and app requirements, and leave some room for growth without treating “maximum” as the goal.

## When a GPU matters

A graphics processing unit (GPU) can accelerate particular workloads, such as supported video transcoding or some AI models. It is optional for many beginner servers. Hardware video acceleration depends on the CPU or GPU, media format, software support, and configuration; do not assume a GPU will work simply because it is installed. For AI, the available graphics memory often limits which models fit, while model size and expected response speed affect the experience. First check the documentation for the exact software and hardware generation you are considering.

## Storage, power, and noise

Hard drives provide high-capacity bulk storage, while solid-state drives (SSDs) have no moving parts and can offer faster access. Neither is a backup. Consider drive compatibility, the number of bays, how you will connect the disks, and whether you can replace a failed disk safely. A server chassis that cannot fit future drives may constrain the whole build.

A server left on around the clock uses electricity even when idle. CPU generation, disks, fans, power-supply efficiency, and workload all affect consumption. A watt-meter and your utility's rate can help estimate ongoing cost once a system is available; manufacturer figures are not the same as your real usage. Think about where the machine will live. Several spinning disks and small high-speed fans can be noticeable in a quiet room. Good airflow matters because heat shortens component life, but louder fans are not the only solution—appropriate cooling and sensible placement help too.

## A buying checklist

Prefer supported, reliable components over a bargain that is hard to troubleshoot. Check motherboard expansion and drive connections, memory type and capacity, network connectivity, power supply quality, physical dimensions, and warranty. Used hardware can be good value, but assess drive health and age, and budget for replacement. Avoid buying disks as a complete backup plan: the backup copy should be separate from the server.

For a first build, list requirements and constraints, then compare a small number of complete systems. Do not let a future hypothetical workload drive today's purchase. You can often learn the basics on existing hardware before committing to a larger machine.

<aside class="on-sol" aria-label="On SOL">
<p><strong>On SOL</strong></p>
<p>SOL runs on a Ryzen 9 3900X (12 cores / 24 threads), 32 GB of RAM, an RTX 3080 that handles transcoding, camera object detection, and local AI models, and a 91 TB array. That's far more than a first server needs.</p>
</aside>

## Next steps

- List the applications and simultaneous workloads you truly need.
- Check each tool's official hardware requirements before choosing parts.
- Decide where the machine will sit and what power use and noise you can accept.
- Compare new and used complete systems, including the cost of a separate backup.

## Official documentation

- [Unraid documentation and hardware requirements](https://docs.unraid.net/)
- [Plex hardware transcoding overview](https://support.plex.tv/articles/115002178853-using-hardware-accelerated-streaming/)
- [Ollama GPU support](https://docs.ollama.com/gpu)
