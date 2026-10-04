---
title: Keeping it healthy and secure
description: Build a manageable routine for updates, monitoring, logs, passwords, and recoverable configuration.
order: 10
---

A home server is software and hardware that need care over time. A simple routine is more useful than installing many dashboards and checking them once. Decide what you need to know, who can reach the server, and how you would recover before trouble occurs.

## Notice problems early

Uptime Kuma can check whether services respond and alert you when a check fails. Prometheus collects time-series measurements, and Grafana can display those measurements in dashboards. Scrutiny uses drive health information to help monitor storage devices. These tools answer different questions: an app responding does not prove its data is healthy, and a drive health indicator is not a guarantee against failure.

Start with a small number of checks that lead to an action. A notification should say what failed and where you can investigate it. Avoid false confidence from a green dashboard: monitoring can miss an outage if its own host, network, or notification route is down. Keep a way to reach the system locally, and occasionally verify alerts arrive.

Logs record events from the operating system and applications. They can help you diagnose a failed update or repeated restart. Learn how long logs are retained and whether they include private data such as usernames, file names, or tokens. Do not post unredacted logs publicly.

## Updates without surprises

Updates fix defects and security problems, but can also change behavior. Read release notes for the operating system, containers, and plugins you depend on. Keep a record of important changes and avoid updating every component blindly at the same moment. Before a major update, confirm that application data and configuration can be restored. Afterward, check essential services and alerts.

Container image updates do not necessarily back up application databases or settings. Export configurations where available and include persistent app data in your backup plan. Store a copy away from the server; if the only backup is on the same machine, a machine-wide failure can take both copies.

## Security basics

Use unique, strong passwords for server accounts and services. A password manager such as Vaultwarden can help store credentials, but a self-hosted password vault becomes a sensitive service in its own right. Protect it with strong authentication, keep its data backed up securely, and understand how you would regain access after a failure. A password manager's own documentation should guide client setup and recovery.

Use least privilege: give each application only the files, network access, and permissions it needs. Minimize exposure by keeping management pages private and removing unused services and router rules. Put authentication in front of sensitive interfaces. Keep the operating system, container images, proxy, and remote-access software updated. Never put passwords, API keys, private addresses, or tokens in public configuration or documentation.

## A routine you can keep

Once a week or month—choose a realistic interval—review alerts, backup results, and pending updates. Check that important drives are visible and that no service is repeatedly restarting. On a separate schedule, test restoring a file and review who has access. Keep the written recovery steps outside the server. A short, repeatable checklist is easier to maintain than a complex stack with nobody responsible for it.

<aside class="on-sol" aria-label="On SOL">
<p><strong>On SOL</strong></p>
<p>SOL is watched by Uptime Kuma (is it up?), Prometheus and Grafana (how is it doing?), Scrutiny (are the drives healthy?), and Dozzle (what are the logs saying?). Passwords live in Vaultwarden.</p>
</aside>

## Next steps

- Select one service check and prove its notification reaches you.
- Write an update and restore checklist before the next major change.
- Use unique credentials and restrict access to administrative interfaces.
- Test recovering an application configuration and a personal file.

## Official documentation

- [Uptime Kuma](https://github.com/louislam/uptime-kuma)
- [Prometheus documentation](https://prometheus.io/docs/introduction/overview/)
- [Grafana documentation](https://grafana.com/docs/grafana/latest/)
- [Scrutiny](https://github.com/AnalogJ/scrutiny)
- [Dozzle documentation](https://dozzle.dev/)
- [Vaultwarden](https://github.com/dani-garcia/vaultwarden)
- [Bitwarden help: two-step login](https://bitwarden.com/help/two-step-login/)
