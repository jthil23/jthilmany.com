---
title: Two interfaces, one scheduling app
summary: A desktop app for time off, weekly schedules and team availability. I added a modern React interface inside the existing executable, so people could move over when they were ready instead of waiting for a rewrite.
kind: .NET desktop app
period: Ongoing
role: Lead developer
stack: [.NET Framework 4.8, WinForms, React, TypeScript, WebView2, Oracle, NUnit, Power Automate]
order: 1
facts:
  - { value: '2 UIs', label: 'in one executable' }
  - { value: '~5,800', label: 'automated tests' }
  - { value: '20', label: 'reports in five categories' }
flow:
  - { label: 'Employee or manager', note: 'Chooses classic or new UI' }
  - { label: 'React shell', note: 'Hosted in WebView2' }
  - { label: 'Message bridge', note: 'Named, HTTP-shaped routes' }
  - { label: 'Shared C# services', note: 'Used by both UIs' }
  - { label: 'Database + flows', note: 'Data, approvals, notifications' }
images:
  - src: ./img/workforce-scheduling-app/04-assign-work.png
    alt: Assign work screen with readiness tiles for understaffed tasks and people without tasks, copy, build rotation and publish buttons, and lists of people and tasks. Sample data, names blurred.
    caption: Managers build the week with readiness counts in view, and can see who is off before assigning.
  - src: ./img/workforce-scheduling-app/08-reporting-hub.png
    alt: Reporting hub with report categories on the left and date range, group, generate and export controls on the right.
    caption: Twenty reports in five categories, generated on demand with PDF or spreadsheet export.
---

## Problem

Time-off requests, weekly work schedules and team coverage lived in separate calendars, spreadsheets and follow-up messages. Employees and managers had to piece together who was working, who was away and which requests needed a decision. Every request and every weekly schedule went through that friction.

## Process

The lifecycle the app supports:

- **Time off:** request, then overlap and balance checks, then manager review (approve, hold or reject), then notifications. Later releases added withdrawals, review queues for held and completed requests, bulk decisions, and delegated approval with a start and end date.
- **Scheduling:** build the week, check readiness (tasks below required staffing, people with no tasks), copy a previous week or generate a rotation, then publish. Rotations respect pending, approved and held time off.
- **Exceptions:** a request that breaks a rule, two managers deciding the same request, a manager who has left. Each settled decision is recorded as a numbered ruling so it isn't reopened by accident.

## Build

The app is a .NET WinForms desktop app over a relational database. The obvious move was a rewrite. Instead, I put a React and TypeScript single-page app inside the **same executable**, hosted in WebView2. Users switch between the classic and new interfaces at runtime. If the new shell can't start, the app falls back to classic, so nobody is ever left without a working tool.

The React client never talks to the database. It calls named routes over a message bridge with an HTTP-shaped envelope. C# handlers on the other side reuse the existing services, authorize every id they receive, and log their duration. Because the envelope already looks like HTTP, moving off the desktop later means replacing the transport, not the app.

Keeping two UIs honest takes discipline:

- **One local gate.** A single command runs the build, a TypeScript check, the unit-test suite and a bundle-freshness check, and fails on any problem.
- **Convention guards.** About 40 test suites read the TypeScript client as text and enforce rules a compiler can't, such as "a failed load must never render as an empty list or a zero".
- **Strict release builds.** A test proves the bytes embedded in the executable match the bundle that was built.

## Outcome

Time off, scheduling, availability, notifications and reporting now live in one tool. The new interface covers about 15 destinations, and the app ships regular releases with a detailed changelog. The design lets people move over gradually, with the classic UI as a safety net, instead of forcing a big-bang cutover.

## What I learned

The hard part wasn't building the new screens. It was keeping two interfaces behaving identically. A written list of known parity gaps, and tests that treat "unknown" and "zero" as different things, did more for quality than any single feature.
