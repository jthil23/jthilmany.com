---
title: Storage and protecting your data
description: Learn what an array, parity, and cache do, then plan backups that survive server failure.
order: 4
---

Storage decisions determine how files are arranged, how space grows, and what happens when a drive fails. Begin by separating two goals: keeping the server available after a hardware problem, and recovering a file or system after something is deleted, corrupted, stolen, or damaged. These are different protections.

## Array and parity in plain English

In Unraid, an array is a group of data drives managed together. The drives can be different sizes, though the usable capacity depends on the layout and filesystem. A parity drive stores calculated information that can help reconstruct the contents of a failed data drive. Unraid allows one or two parity drives; the number of parity drives affects how many simultaneous drive failures the system can recover from, not whether every possible failure is harmless.

Parity does not keep a historical copy of your files. If you accidentally delete a file, corruption is written to the array, or ransomware encrypts data that the server can write, parity may preserve that changed state rather than the original. A fire, theft, or power event that affects the whole machine can take both data and parity. Therefore parity is not a backup. Treat it as a way to maintain access after certain drive failures, not as protection against every kind of loss.

## Cache and fast storage

A cache pool is faster storage that some systems can use for application data, virtual machines, or temporary writes before data is moved to the main array. SSDs are common choices, but the exact behavior depends on operating-system settings and the shares involved. Understand where each application writes its database and files. If the only copy of an important application database lives on a single cache device, it needs its own backup plan.

Keep the words “cache” and “backup” separate in your notes. A cache may improve speed, but it does not necessarily make another recoverable copy. Confirm how files move between storage tiers and what happens if a device or pool fails.

## The 3-2-1 backup rule

A useful starting principle is 3-2-1: keep three copies of important data, on two different kinds of storage, with one copy off-site. The original counts as one copy. The off-site copy should not depend on the same building, power, or account credentials as the server. The details can vary, but the goal is to avoid one event destroying every copy.

Back up the files that would be difficult or impossible to recreate: family photos, documents, project files, and application configuration. Choose backup software and a destination you can maintain. Encrypt sensitive backups, protect access credentials, and make sure the backup process reports failures. A green indicator is useful only if you periodically test a restore.

## Practice recovery

Make a small test backup, remove a disposable file, and restore it using your written steps. Check that the restored file opens. Know where recovery keys and configuration exports are stored. Review the plan when the amount or importance of your data changes. A backup that has never been restored is an assumption, not a proven recovery path.

<aside class="on-sol" aria-label="On SOL">
<p><strong>On SOL</strong></p>
<p>SOL's array is 91 TB. Size doesn't change the rule: parity can rebuild a failed drive, but anything irreplaceable still needs copies somewhere else.</p>
</aside>

## Next steps

- Identify the files you cannot replace and where their only copy lives.
- Learn the selected OS's parity, cache, and share behavior before creating storage.
- Choose an independent off-site backup destination.
- Test restoring a harmless file and write down the exact steps.

## Official documentation

- [Unraid storage documentation](https://docs.unraid.net/)
- [CISA backup guidance](https://www.cisa.gov/stopransomware/ransomware-guide)
