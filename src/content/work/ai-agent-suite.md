---
title: A governed AI toolkit for citizen developers
summary: A shared library of AI skills, agents and data connectors that lets non-technical teammates query data, build low-code apps and produce on-brand documents, starting read-only and earning write access.
kind: AI tooling
period: '2026'
role: Author and owner
stack: [Claude Code plugins, MCP servers, Hooks, PowerShell, Python, Node]
order: 3
facts:
  - { value: '~40–50', label: 'skills' }
  - { value: '~10', label: 'subagents' }
  - { value: 'Read-only', label: 'by default' }
flow:
  - { label: 'Plain-English request', note: 'From a teammate' }
  - { label: 'AI assistant + plugins', note: 'Skills, commands, agents' }
  - { label: 'Permission gate', note: 'Hook checks every write' }
  - { label: 'Data connectors', note: 'MCP servers' }
  - { label: 'Answer or deliverable', note: 'Audited and on-brand' }
images: []
---

## Problem

A teammate needs an answer that lives in a database. It's in there, but getting it out means writing SQL they don't know, or waiting for someone technical. The same pattern repeated across the team. Documents such as charters, business cases, test scripts and status reports looked different depending on who wrote them. And people building low-code apps and flows had no shared, safe way to get AI help.

## Process

The key decision was that **trust has to be earned**:

- **Everyone starts read-only.** Write access to a live system requires a training sign-off.
- **Every write is visible.** A write shows exactly what will change and needs explicit approval. Destructive operations need a second confirmation, and one class of destructive statement is blocked for everyone, including me.
- **Fail safe.** If the permission list can't be read, reads still work and unauthorized writes are blocked.
- **One maintainer.** I ship the updates. Teammates see an update banner and re-run one command.

## Build

The AI assistant already supports plugins (skills, slash commands, subagents and hooks) and MCP servers. That meant the team's expertise could be packaged as text and small helper programs rather than a new application. It covers:

- **Branded documents.** Dozens of templates turn a plain description, or messy meeting notes, into a print-ready deliverable.
- **Power Platform authoring.** Skills and agents to specify, build, review and test canvas apps, cloud flows and model-driven apps.
- **Data access.** Ask a question in English, and an MCP server runs the query under the permission model above.
- **An ROI agent.** A read-only assessor reads a finished project, classifies the work and estimates its value. Publishing that estimate is a separate, human-approved step.


## Outcome

Teammates who aren't developers can now query data, update lists and produce consistent, branded documents in plain English. That used to depend on a technical colleague. AI usage is tracked by project and model, so its cost is visible.

## What I'd change

These guardrails are client-side defaults, not a security boundary. They live in each person's own settings. Stronger central enforcement, such as administrator-managed settings and database-level read-only accounts, is the next step. Delivery also turned out to be harder than content. A home-made installer copying files from a network share made every update heavy, so the direction now is "keep the tools, change the delivery" by moving to the vendor's native plugin distribution.
