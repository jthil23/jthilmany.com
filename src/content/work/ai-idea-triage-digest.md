---
title: A morning digest that has already read every idea
summary: A daily Power Automate flow that has a language model classify each new improvement idea into structured JSON, then writes one digest email for the team.
kind: Power Automate + AI
period: '2026'
role: Builder
stack: [Power Automate, LLM API, Structured JSON output, Outlook HTML email]
order: 4
facts:
  - { value: 'Daily', label: 'one digest email' }
  - { value: '2', label: 'model calls with separate jobs' }
  - { value: 'JSON', label: 'fixed picklists, no free text' }
flow:
  - { label: 'Daily schedule', note: 'Yesterday’s submissions' }
  - { label: 'Sanitise fields', note: 'Safe to embed in JSON' }
  - { label: 'Call 1: classify', note: 'One idea at a time' }
  - { label: 'Call 2: write digest', note: 'Whole set as HTML' }
  - { label: 'Team inbox', note: 'One card per idea' }
images: []
---

## Problem

A team receives improvement ideas and requests through an intake tracker. Triage meant someone reading every submission to decide what kind of work it was, how urgent it was, and what to ask the person who submitted it. That chore came back every time new ideas arrived.

## Process

For each idea, the job is three decisions and a short brief:

- **Classify** with exactly one category, one sub-category and one of four priority levels, chosen from fixed picklists. The model may not invent values.
- **Brief leadership** with a short summary, a difficulty rating with a one-sentence reason, and only the questions the submitter can answer. The model is told about the team's existing solutions, so it doesn't ask things the developers already know.
- **Hand off** as one email to the team, with one card per idea.

## Build

A scheduled cloud flow collects the previous day's submissions and loops over them. Each idea's fields are cleaned and sent to a language model, which must return raw JSON in a fixed shape: category, sub-category, priority, reasoning and an analysis block. Because the shape is fixed, the flow can merge the result with the original row without parsing free text. The reasoning field makes every classification explainable.

A **second** call receives the whole set and only handles presentation. It follows an email-safe HTML template, repeats one card per idea, colours the priority badge and adds a short greeting with the day's count. Splitting judgement from presentation keeps each prompt small, and the digest call never needs to know the taxonomy.

## What I learned

Most of the debugging was about text, not AI. Free-text fields, and even the stored instructions, contained quotes and line breaks that broke hand-built JSON request bodies. One version failed with an HTTP 400 until the quotes were escaped. Sanitising inputs fixed it. Building request bodies with a JSON-aware expression instead of string concatenation is the more durable fix.
