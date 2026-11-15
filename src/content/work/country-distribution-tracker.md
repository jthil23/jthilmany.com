---
title: One row per country, one record at the end
summary: A Power App that replaced a spreadsheet and an unused form for tracking safety-letter distribution across 31 countries, ending in a one-click PDF completion record.
kind: Power App
period: '2026'
role: Maker (AI-assisted build)
stack: [Power Apps, SharePoint lists, Power Automate, PDF generation]
order: 2
facts:
  - { value: '31', label: 'countries in scope' }
  - { value: '~70', label: 'checks in the test script' }
  - { value: '0', label: 'accessibility checker errors' }
flow:
  - { label: 'Request', note: 'One per letter' }
  - { label: 'Country rows', note: 'Each country keeps its own' }
  - { label: 'Completion view', note: 'Export locked until done' }
  - { label: 'PDF flow', note: 'Generated server-side' }
  - { label: 'Document library', note: 'Filed and emailed' }
images:
  - src: ./img/country-distribution-tracker/01-country-browse.png
    alt: Two-pane screen with a list of countries and coloured status and overdue pills on the left, and one country's dates, quantities and target groups on the right. Sample data.
    caption: Browse first. Pick a country, see its status at a glance, and open the full record.
  - src: ./img/country-distribution-tracker/02-country-row-form.png
    alt: Step two of a three-step form, with a short country list and a grid of status, date, quantity and text fields. Sample data.
    caption: The same form reopens for edits, so each country keeps one complete record.
  - src: ./img/country-distribution-tracker/03-completion-locked.png
    alt: Completion screen showing 28 of 31 countries complete, two blocking countries named, and a greyed-out export button. Sample data.
    caption: Progress across every country, the ones still blocking, and an export that stays locked.
  - src: ./img/country-distribution-tracker/04-completion-ready.png
    alt: The same completion screen with 31 of 31 complete and the PDF button enabled. Sample data.
    caption: Once every country is complete, the completion record is a single click.
---

## Problem

When a health authority requires a safety communication, it has to reach agreed groups of healthcare professionals in every affected country. The company has to be able to show it did. That evidence lived in two places:

- **A spreadsheet tracker** with about 15 columns per country: approval dates, due date, actual distribution date, target groups, quantities, returns and more.
- **An entry form that nobody used.** It was write-only. People could submit an entry but couldn't find, check or fix it afterwards, so they put the work off.

Central process owners chased and assembled the evidence by hand. Country contacts had no simple way to keep their own status current over the roughly two months a distribution takes. Requests are rare and unscheduled, so there was no routine to fall back on.

## Process

I worked from the requirements brief, a kickoff conversation and the existing tracker's columns:

- **One request per letter, one row per country.** Each row moves from Planned to Submitted to Approved to Completed. The dates between those steps are part of the evidence.
- **Start early, finish carefully.** A row can be created with most fields unknown, because an early entry shows that action started. The export, on the other hand, is locked until every country is Completed.
- **People decide, the app records.** Status changes are always a human judgement. "Overdue" means the due date has passed and the row isn't Completed, and a blank date is never overdue.
- **Exceptions:** countries that only post to a website, returns and failed deliveries, rows added by mistake.
- **Roles:** contributors edit their own country, approvers edit any row, admins manage reference lists and access.

## Build

It had to run on standard licensing, live in the team's existing Microsoft 365 site, and be simple enough for people who use it a few times a year. A canvas app over SharePoint lists gave a purpose-built experience without a new platform. A cloud flow generates the PDF server-side, files it in a versioned library and emails the requester a link.

I built it conversationally with an AI coding assistant. That covered the app definition, list schema, export template, test script, and live verification through browser automation. The requirements, compliance interpretation and every product decision stayed with people.

## Outcome

At the time of writing, the app was heading into user acceptance testing. The build was complete, the accessibility checker reported zero errors, a roughly 70-check test script was written, and the export was verified against a sample. Because of that, no adoption figures are claimed here. What changed by design:

- One searchable record per country, instead of a spreadsheet and a form nobody trusted.
- Country contacts can find and edit their own records, which was the exact failure of the old form.
- The completion record is generated in seconds instead of assembled by hand.

## What I'd change

A structured review before testing produced 9 must-fix items, 20 UX improvements and 11 ideas for a second version. The themes: edit rights should follow who owns each country's work, saves across many rows should confirm every write, a status should only be accepted once the evidence for it is present, and access should be enforced in the data layer, not only the interface.
