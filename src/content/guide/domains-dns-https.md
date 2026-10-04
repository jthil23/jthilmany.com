---
title: Domains, DNS, reverse proxies, and HTTPS
description: Follow a request from a memorable name to a local service, and learn what HTTPS does and does not protect.
order: 6
---

A self-hosted service needs a path from the device you use to the computer running it. A domain name, DNS, a reverse proxy, and HTTPS are separate pieces of that path. Understanding their jobs helps you avoid exposing services just to make a link convenient.

## Names and DNS

A domain is a human-readable name registered through a registrar. The Domain Name System (DNS) translates names into network destinations. A DNS record is published information that tells clients where a name should lead; it does not install a service or grant access. A private DNS record can be useful inside a network, while a public record can reveal that a name exists and direct visitors toward an address. Use records that match your actual design and avoid publishing private network details.

Names can point to a reverse proxy, which is a service that receives web requests and forwards them to the right application. Nginx Proxy Manager (NPM) offers a graphical interface to define these routes and configure certificates. The proxy uses request details such as the requested host name to select an upstream. Keeping the applications and proxy on a private network can prevent every app from needing its own public listener.

## HTTPS and certificates

HTTPS encrypts web traffic between the browser and the HTTPS endpoint, and lets the browser verify that endpoint's certificate matches the requested name. A certificate does not decide who is allowed to use an application. Add authentication and access controls when a service should be private. Also consider the route from proxy to application: encryption at the browser-facing proxy does not automatically encrypt every internal network hop.

A certificate authority can issue a certificate after validating control of a name. Automated renewal is convenient, but only if the challenge method, DNS permissions, and storage are configured correctly. Never paste a broad DNS API token into a public file. Use the narrowest permissions available, store secrets outside version control, and plan what happens if the certificate cannot renew.

## The safer sequence

Do not begin by forwarding router ports to multiple apps. First make a service work locally. Decide whether access should be available only at home, over a private overlay network, or publicly. Then configure a reverse proxy and HTTPS only for the services that need that path, and put authentication in place before external access. A reverse proxy is not a firewall by itself; it can route traffic but it does not guarantee safe configuration.

Test from a device outside your home network if you intend public access. Confirm that unexpected names and routes do not reach an unprotected management panel. Keep the proxy and apps updated, and remove old routes when they are no longer used.

<aside class="on-sol" aria-label="On SOL">
<p><strong>On SOL</strong></p>
<p>On SOL, Nginx Proxy Manager routes each subdomain to the right container and handles TLS, with access rules that only admit my home network and Tailscale.</p>
</aside>

## Next steps

- Draw the request path from browser to service before changing DNS or router settings.
- Decide which services should be local, private-remote, or public.
- Read NPM's proxy-host and access-list documentation; configure authentication separately.
- Check DNS and certificate credentials are narrowly scoped and kept private.

## Official documentation

- [Cloudflare DNS record types](https://developers.cloudflare.com/dns/manage-dns-records/reference/dns-record-types/)
- [Nginx Proxy Manager documentation](https://nginxproxymanager.com/guide/)
- [Let's Encrypt how it works](https://letsencrypt.org/how-it-works/)
- [MDN HTTPS overview](https://developer.mozilla.org/en-US/docs/Glossary/HTTPS)
