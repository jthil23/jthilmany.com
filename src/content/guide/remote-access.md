---
title: Remote access without opening ports
description: Use a private network overlay to reach selected home services without publishing them to the public Internet.
order: 7
---

Remote access is useful when you want to reach a file or dashboard away from home. It is also one of the easiest ways to accidentally make a private service available to strangers. A private overlay network can provide a safer alternative to forwarding ports on your router, but it still needs careful identity and device management.

## What Tailscale does

Tailscale creates a private network between devices you authorize. It uses WireGuard-based encrypted connections and can often connect devices directly; when that is not possible, it can relay encrypted traffic. A device must be enrolled in your account or tailnet (Tailscale's name for its private network) before it can participate. This means access is based on device and identity policy rather than a public web address alone.

Install Tailscale on the devices you want to connect, sign in, and review the access controls offered for your plan. Start with a single user and a single server. Learn how devices are approved and removed. If a phone or laptop is lost, revoke that device promptly. Use strong account authentication and review the list of connected devices periodically.

## Understand the boundaries

Tailscale can avoid opening inbound router ports for many setups, but it does not make every service automatically private. A service may still be exposed through another route, such as a reverse proxy or a router rule left over from an earlier experiment. Check actual firewall and proxy configuration. Do not enable subnet routing or exit-node features until you know what traffic they carry and which devices are allowed to use them.

Tailscale is a managed coordination service. Your devices establish encrypted connections, but account access and network policy still matter. Read the privacy and security documentation to understand how coordination works. If the service is unavailable, a new connection may be affected even if already established peer connections continue; avoid relying on assumptions about behavior and plan for access to your server's local console.

For web apps, you may use a private DNS name and a reverse proxy within the tailnet. Keep authentication enabled on services that need it. Network membership should not be treated as a substitute for an app password, especially for sensitive systems.

## Test before trusting it

First confirm you can reach one low-risk service from your own phone on cellular data. Verify it is not reachable when Tailscale is disconnected. Then review the server's public exposure from outside the home network. Write down how to remove an authorized device and how to recover account access. Avoid sharing an account login when a proper shared-access policy is available.

<aside class="on-sol" aria-label="On SOL">
<p><strong>On SOL</strong></p>
<p>I reach SOL from anywhere through Tailscale, without opening a single port on my router.</p>
</aside>

## Next steps

- Read the official introduction and security model before adding devices.
- Enroll only devices you control and enable strong account authentication.
- Test access both with and without the private network connected.
- Review router, proxy, and firewall rules for older exposure you no longer need.

## Official documentation

- [Tailscale documentation](https://tailscale.com/kb/)
- [Tailscale security model](https://tailscale.com/security)
- [WireGuard overview](https://www.wireguard.com/)
