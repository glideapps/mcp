# GlideOS Allowlist Facts

> Portable copy of the research handoff behind the customer-facing allowlisting help article.
> Canonical source: `docs/operations/network-allowlist.md` in `glideapps/g3`, branch `claude/whitelisting-help-article-ri1zrv`.
> All file paths below are relative to that repo root.

Internal fact sheet behind the customer help article **"GlideOS domains and IP addresses to allow"**
(modeled on Salesforce's [Core Services — IP Addresses and Domains to Allow](https://help.salesforce.com/s/articleView?id=000384438&language=en_US&type=1)).

**Audience of this file:** the enablement writer producing the article, plus support staff who need to
answer an IT team today. **Audience of the article:** a customer's IT / network / mail admin.

Every row is marked **Confirmed** (with the code path that proves it) or **Verify** (the writer must
check before publishing, per the 90% rule in `Glide-Enablement-Superskill`). Nothing marked Verify
should reach a customer unchecked.

---

## 1. The headline answer

**Glide does not publish fixed IP ranges. Allow by domain.**

This is the single most important sentence in the article, and it is true in both directions:

| Direction | Why there is no IP list |
|---|---|
| **Inbound** (customer → GlideOS) | Every platform hostname is served from Cloudflare's global anycast network. The IP a customer resolves depends on which Cloudflare edge is nearest them and changes without notice. Cloudflare publishes its ranges at [cloudflare.com/ips](https://www.cloudflare.com/ips/), but that list covers millions of unrelated sites, so allowing it is not a meaningful control. |
| **Outbound** (GlideOS → customer systems) | Platform code runs as Cloudflare Workers, which have no static egress IP. Integration actions execute on Composio's infrastructure, not Glide's. Email leaves from Mailgun's rotating pool. Confirmed: `workers/notification-center/wrangler.toml:163` — "The egress IP is Mailgun-side and NOT fixed — a rotating set while the dedicated IP warms — so nothing here pins one." |

Salesforce reaches the same conclusion in the source article and says so plainly (they discourage IP
allowlisting and point customers at mTLS instead). The article should take the same posture: **name
the domains, explain why there is no IP list, and give the customer a better control** (bearer token
or signed webhook auth on their side, SSO instead of email links).

**Do not hand a customer a single observed IP.** Measured 2026-07-31: 80% of production mail left on
shared IPs `204.220.184.18` / `69.72.42.253` and only 20% on the dedicated `198.244.54.82`. An
allowlist built from one observed send silently drops the rest. This is a documented anti-pattern in
the `debug-email-delivery` skill (`.claude/skills/debug-email-delivery/SKILL.md`).

---

## 2. Domains — platform (browser must reach these)

All **Confirmed** in `docs/DNS.md` unless noted. All HTTPS on 443.

| Hostname | What it serves | Stability |
|---|---|---|
| `os.glideapps.dev` | The GlideOS dashboard and project builder. The primary hostname users load. | Stable |
| `os.glideapps.com` | CNAME to `os.glideapps.dev`. Same dashboard, `glideapps.com` zone. | Stable |
| `id.glideapps.dev` | Sign-in, sign-up, invite acceptance, app login. | Stable |
| `auth.glideapps.dev` | Branded OAuth callback for Google / Microsoft sign-in (CNAME to `cname.descope.com`). | Stable |
| `api.glideapps.dev` | The public GlideOS API (`API_PUBLIC_BASE_URL`, OpenAPI `servers[]`). Confirmed: `workers/api/wrangler.toml:174`. | Stable |
| `mcp.glideapps.dev` | Model Context Protocol server — needed by customers connecting Claude, Cursor, or another MCP client. | Stable |
| `hooks.glideapps.dev` | Inbound webhook triggers. The customer's systems POST **to** this host. Confirmed: `docs/DNS.md` "Webhook triggers (#5048)". | Stable |
| `www.glideapps.com` | Marketing site and documentation. Also the 308 target for the bare `glideapps.dev` / `glideos.app` apexes. | Stable |
| `app-icons.glideapps.com` | App icon rendering service. Confirmed: `workers/project/src/icons/render.ts:44`. | Stable |

### Do NOT put these in the article

| Hostname | Why not |
|---|---|
| `g3internalapi.dev` | First-party callers only. `docs/DNS.md`: "never publish it in the API contract." Tracked for decommission in [#10031](https://github.com/glideapps/g3/issues/10031). |
| `support.glideapps.dev` | Staff-only console, gated by Cloudflare Access. |
| `slipstream.glideapps.dev` | Internal. |
| `*.g3-sandbox.dev`, `pr-<n>.g3-sandbox.dev`, `api-dev.glideapps.dev` | Preview pods and dev surfaces. No customer ever needs these. |
| `*.glide-g3.workers.dev` | Internal fallback vanity hosts. |

---

## 3. Domains — published apps

**Confirmed** in `docs/DNS.md` and `docs/ARCHITECTURE.md`.

| Pattern | What it serves | Stability |
|---|---|---|
| `*.glideos.app` | **The canonical host for published apps.** Production, deploy-preview, and vanity URLs all land here. `APPS_WORKER_DOMAIN = "glideos.app"` in prod (`workers/project/wrangler.toml:460`). | Stable |
| `glideos.app` | Zone apex. 308s to the marketing site. | Stable |
| `*.glideapps.dev` | Legacy published-app surface **and** the live-preview host zone used inside the builder (`LIVE_PREVIEW_DOMAIN`, #7047). Top-level navigations 308 to `*.glideos.app`; iframes and sub-resources are served in place. **An IT team that allows only `*.glideos.app` will break the builder's live preview.** | Stable, but the two roles are worth stating separately |
| A customer's own custom domain | Bound via Cloudflare for SaaS on the `glideos.app` zone (#4474). The customer points a CNAME at the platform target and we register the hostname. | Stable |

**Custom-domain CNAME target:** resolved at runtime from `CUSTOM_DOMAIN_CNAME_TARGET`, defaulting to
the `custom.<apps-domain>` subdomain — `custom.glideos.app` in prod. Confirmed:
`workers/project/src/shared/custom-domain.ts` and `workers/project/src/tools/apps.ts:718`. **Verify
the exact prod string in the product before publishing it** — it is surfaced to the user by
`app_bind_custom_domain`, so the article and the product must agree.

**Why the apexes matter (a good article sidebar):** `glideapps.dev`, `www.glideapps.dev`,
`glideos.app`, and `www.glideos.app` all serve a real 308 to the marketing site specifically so
enterprise security scanners don't classify the zones as dead or parked and block GlideOS app URLs
(#8835, `docs/DNS.md`). That is a real, already-observed failure mode for exactly the audience
reading this article.

---

## 4. WebSockets and realtime

**Confirmed.** The builder and the dashboard both open WebSockets:

- `workers/dashboard/ui/src/project/lib/use-file-change-feed.ts:41` — file change feed (project builder).
- `workers/dashboard/ui/src/lib/use-billing-live.ts:129` — live billing/credit balance.

These are `wss://` upgrades on the **same hostnames already listed** (`os.glideapps.dev`, and the app
host for in-app data), not separate realtime endpoints. So the practical guidance is:

> Allow WebSocket (`wss://`) upgrades on the same hosts. A proxy that permits HTTPS but strips or
> blocks the `Upgrade` header breaks the builder's live updates while the rest of the product
> appears to work.

**Verify:** confirm in a browser that no separate realtime hostname appears in the Network tab, and
capture the exact host pattern for in-app data sockets on a published app.

---

## 5. CDN and static asset hosts

This section does not exist in the Salesforce article and is the one most likely to be missed. A
customer that allows only `*.glideos.app` gets a **blank or unstyled app**.

| Host | Loaded by | Confirmed at | Stability |
|---|---|---|---|
| `cdn.jsdelivr.net` | Every deployed app. The Tailwind v4 browser runtime, pinned to an exact version with an SRI hash. | `workers/project/src/durable-objects/bundler-service.ts:2484`, `workers/project/docs/SECURITY.md:19` | Stable host; the pinned version changes |
| `esm.sh` | Every deployed app that uses React, React Router, Lucide, or Radix. Browser import map resolves npm packages here at runtime. | `workers/project/src/agent/cdn-packages.ts` (React 19, React DOM 19, React Router 7, `lucide-react`, `@radix-ui/*`) | Stable |
| `fonts.googleapis.com`, `fonts.gstatic.com` | The dashboard SPA (Inter, with `preconnect`). | `workers/dashboard/ui/index.html:31-34` | Stable |
| `app-icons.glideapps.com` | App icons. | `workers/project/src/icons/render.ts:44` | Stable |

**Verify before publishing:** load a real published app with the Network tab open and confirm this
list is complete and current. Apps built by the agent can reference other image or asset hosts
depending on what the builder chose, so the article should say the list covers **the platform's own
runtime**, not every asset a given app might use.

---

## 6. Auth and SSO endpoints

| Host | Role | Confirmed at | Stability |
|---|---|---|---|
| `id.glideapps.dev` | The sign-in SPA itself. | `docs/DNS.md` | Stable |
| `api.descope.com` | **The identity provider the browser talks to directly.** GlideOS uses Descope; the sign-in SPA mounts `@descope/react-sdk` and its base URL resolves to `https://api.descope.com` (no `DESCOPE_BASE_URL` override is set in any environment). | `workers/id/src/index.ts:110-112`, `workers/id/ui/package.json:11`, `workers/id/wrangler.toml` (no `DESCOPE_BASE_URL`) | Stable |
| `auth.glideapps.dev` | Branded **OAuth callback** for Google and Microsoft social sign-in. Distinct from the SDK base URL above — both are needed. | `docs/DNS.md` "Auth provider configuration (#3400)" | Stable |
| `accounts.google.com` / `login.microsoftonline.com` | The customer's own IdP redirect for Google or Microsoft sign-in. | Standard OAuth; not Glide-controlled | Stable |
| `www.googletagmanager.com` | GTM container, loaded **only** on the `id` marketing/sign-in surface, never in the product dashboard. | `workers/id/ui/src/google-tag-manager.ts:11` | Stable |

### SAML SSO (enterprise orgs)

**Confirmed** in `docs/operations/descope-sso-setup.md`. Each GlideOS org maps
1:1 to a Descope tenant. The Service Provider values a customer registers in their IdP are:

- **ACS / Reply URL:** `https://api.descope.com/v1/auth/saml/acs?projectId=<projectId>&tenantId=<orgId>`
- **Entity ID:** `<projectId>-<orgId>`
- **Sign-on URL:** leave blank — the connection is SP-initiated.

Two things worth telling the customer, both burned in real setups:
- Their IdP's own "Test" button fires an IdP-initiated assertion, which this connection does not
  support. Test from GlideOS or from Descope's SSO Testing panel.
- Microsoft Entra's `…/claims/name` claim carries the UPN, not the display name. Map **Email** from
  `…/claims/name` and **Name** from `…/identity/claims/displayname`.

**Do not publish the Descope project IDs.** They appear in the entity ID a customer sees in their own
console, but the article should describe the shape and tell them to read the real values from
**Settings → Single sign-on → Configure SSO**, which generates a scoped setup link.

---

## 7. Third-party services the dashboard connects to

All bundled via npm, so the browser reaches the **ingest hosts only** — no third-party script CDN.

| Host | Purpose | Confirmed at | Stability |
|---|---|---|---|
| `us.i.posthog.com` | Product analytics and browser error capture. | `packages/posthog/src/browser.ts:32` | Stable |
| `browser-intake-us5-datadoghq.com` | Datadog RUM (dashboard SPA only; `site: "us5.datadoghq.com"`, session replay off). **Verify the exact intake hostname** — the code sets the site, and the SDK derives the intake host. | `workers/dashboard/ui/src/datadog-rum.ts:38,85` | Stable |
| `api-iam.intercom.io` | In-product support messenger. | `packages/intercom/src/index.ts:252` | Stable |
| `widget.intercom.io`, `js.intercomcdn.com` | Intercom messenger assets. **Verify** — these are Intercom's standard hosts, loaded by `@intercom/messenger-js-sdk`, but confirm in a browser rather than asserting from the SDK name. | `packages/intercom/package.json:15` | Stable |
| `checkout.stripe.com`, `billing.stripe.com` | Upgrade checkout and the billing portal. The browser **navigates** to these (Stripe-hosted redirect), so a blocked host dead-ends the upgrade flow rather than degrading it. | `workers/billing/test/rpc.test.ts:1578` | Stable |

Writer's call on framing: these are optional-but-degrading. Blocking PostHog, Datadog, or Intercom
does not stop a user building; it removes error reporting and in-product support. Blocking Stripe
breaks upgrades outright. Worth saying which is which.

---

## 8. Email — sending domains and authentication

Mailgun is the only transport. **There are two sending domains**, and which one carries a given
message depends on whether the recipient's domain is enrolled in the enterprise cohort (#7647,
PostHog flag `g3-notification-center-enterprise-domain`, owned by sales/support).

| | Default | Enterprise cohort |
|---|---|---|
| **From** | `no-reply@notify.glide-mail.com` | `no-reply@support.glideapps.com` |
| **From name** | Glide | Glide |
| **Sending domain** | `notify.glide-mail.com` | `support.glideapps.com` |
| **DKIM selector** | `krs._domainkey` | `smtp._domainkey` |
| **DMARC** | `p=reject` on the sending domain | `p=quarantine` via the `glideapps.com` org-domain fallback, relaxed alignment, validated live 2026-08-12 |
| **Confirmed at** | `workers/notification-center/wrangler.toml:167-168` | `workers/notification-center/wrangler.toml:169-186` |

**Article guidance:** list both `From` addresses and tell the admin to allow **both sending domains**.
Do not try to explain the cohort mechanism — it is an internal routing decision, and an admin who
allows both is correct either way.

**Click tracking is off** (`o:tracking = no`, `workers/notification-center/src/transport/mailgun.ts:93`).
Links in GlideOS email point at Glide hostnames, not at a tracking wrapper. This matters for the URL-
scanning guidance below, and it corrects the `*.glide-mail.com` URL Defense exemption that
the `debug-email-delivery` skill (`.claude/skills/debug-email-delivery/SKILL.md`) §3b currently recommends.
**Verify the actual link host** in a real magic-link and a real invite email before writing this
section: the invite link is a GlideOS dashboard path (`/accept-invite?token=…`), but the magic link is
generated by Descope and `workers/id/src/magic-link/routes.ts:101` notes those URLs "can point to
multiple host shapes." Get this right — it is the exemption the admin will actually configure.

### Wording discipline for the auth facts

Claim only what is measured. The sanctioned phrasing (from `debug-email-delivery` Phase 2):

> Domain active; SPF and DKIM valid, provider-confirmed. Messages are DKIM-signed and aligned, sent
> over verified TLS. DMARC is published.

Do **not** write "all authentication passing" — the receiver's SPF/DKIM/DMARC verdict is structurally
invisible to us; it lives only in the `Authentication-Results` header of the delivered message.

### Subject lines

**Confirmed** in `workers/notification-center/src/templates/registry.ts`. Brand renders from
`BRAND_LABEL`, which is `GlideOS` in prod (`workers/notification-center/wrangler.toml:158`).

- Sign in to GlideOS
- Your GlideOS sign-in code
- `<inviter name>` invited you to join `<org name>` on GlideOS
- Member request for `<org name>`
- Your workflow hit an error
- Glide turned off "`<workflow name>`"
- `<org name>` is out of GlideOS credits

**Verify at write time** — subjects change, and a stale subject in an admin's filter rule is worse
than no subject at all.

### Gateway-specific instructions

The most common real failure is not a bounce. It is accept-then-quarantine: the gateway returns SMTP
250 at its edge, then holds the message in an admin-side quarantine the recipient never sees. The
identifying MX patterns and the matching console paths are already documented in
the `debug-email-delivery` skill (`.claude/skills/debug-email-delivery/SKILL.md`) Phase 0 and §3b — Proofpoint
on Demand (`*.pphosted.com`), Proofpoint Essentials (`*.ppe-hosted.com`, a different product with a
different console), Microsoft 365 / EOP, Google Workspace, Mimecast, Barracuda.

Two points belong in the article regardless of gateway:

- **Exempt GlideOS sign-in links from URL scanning.** Pre-click link scanning (Proofpoint URL Defense,
  Microsoft Safe Links) can consume a single-use sign-in token before the human clicks, so the link
  arrives already expired despite clean delivery. This is the standing argument for SSO.
- **Re-send after allowlisting.** Quarantined messages never auto-retry. Invites issued before the
  allowlist change must be revoked and re-issued to travel under the new rules.

---

## 9. Outbound — what GlideOS calls out to, and from where

For the customer who firewalls their own API or database and wants to allow Glide in.

| Path | Egresses from | Static IP? |
|---|---|---|
| Workflow HTTP steps, agent tool calls, `run_backend_code` | Cloudflare Workers, global network | **No.** No static egress. Cloudflare's ranges are at [cloudflare.com/ips](https://www.cloudflare.com/ips/) and cover far more than Glide. |
| Integration actions (Slack, Gmail, Google Calendar, Notion, GitHub, and the rest of the catalog) | **Composio**, at `backend.composio.dev` — not Glide infrastructure. Confirmed: `workers/project/src/composio/client.ts:22`. | **No.** And the ranges are Composio's, not ours. |
| Transactional email | Mailgun US, rotating pool. Confirmed: `workers/notification-center/wrangler.toml:163`. | **No.** The sending domain's SPF record is the only authoritative IP set — and it changes. |

**Recommend instead of an IP allowlist:** a bearer token or API key the customer issues to Glide, a
signed webhook secret, or mTLS. That is the same recommendation Salesforce makes in the source
article, so the framing will look familiar to an IT reader who has read theirs.

**What we block on the way out** (worth one sentence, it answers a security-review question before
it is asked): outbound requests from app backend code and agent sandboxes pass a shared SSRF guard
that permits only HTTP and HTTPS and blocks RFC 1918, loopback, link-local, carrier-grade NAT,
multicast, broadcast, and cloud metadata hosts. Confirmed: `packages/common/src/outbound-guard.ts`.

---

## 10. Ports and protocols

| | |
|---|---|
| **443 / TCP, TLS** | Everything. All platform hostnames, all app hostnames, all third-party hosts. |
| **WebSocket over TLS (`wss://`)** | On 443, on the hostnames already listed. No separate port. Must not have the `Upgrade` header stripped. |
| **SMTP** | Inbound to the customer's own mail infrastructure, from Mailgun. Nothing for the customer to open. |
| **Minimum TLS** | 1.2. **Verify** the setting for the `glideapps.dev` and `glideos.app` zones — `docs/DNS.md` records Minimum TLS 1.2 explicitly for `g3internalapi.dev` and in the `glideos.app` bootstrap steps, but confirm the two customer-facing zones in the Cloudflare dashboard rather than inferring. |

No non-standard ports. No inbound firewall rules required on the customer's side for the product
itself — only for webhooks they choose to receive.

---

## 11. Stability — how to word the caveat

The user asked for this explicitly, and it shapes the whole article.

| Tier | Items | How to word it |
|---|---|---|
| **Stable — safe to put in an allowlist** | `os.glideapps.dev`, `id.glideapps.dev`, `auth.glideapps.dev`, `api.glideapps.dev`, `mcp.glideapps.dev`, `hooks.glideapps.dev`, `www.glideapps.com`, `*.glideos.app`, `*.glideapps.dev`, both email sending domains, port 443 | State them as the current configuration. Add one line telling admins where changes get announced, and prefer wildcards where we publish them so a new subdomain doesn't require a change ticket. |
| **Stable host, changing content** | `cdn.jsdelivr.net` (pinned Tailwind version changes), `esm.sh` (package set grows) | Allow the host, not a path. Say so — a path-scoped rule will break on the next version bump. |
| **Third-party, outside Glide's control** | PostHog, Datadog, Intercom, Stripe, Descope, Google Fonts, Composio | Name them as third parties with their own change cadence, and link to their own documentation rather than restating their infrastructure. |
| **Never stable** | Every IP address, in both directions | Say we do not publish IP ranges and why. Do not print a single IP anywhere in the article, including as an example. |
| **Not customer-facing at all** | `g3internalapi.dev`, `support.glideapps.dev`, `slipstream.glideapps.dev`, `*.g3-sandbox.dev`, `*.workers.dev`, `api-dev.glideapps.dev` | Omit entirely. |

The honest framing: hostnames are stable and we will tell you before they change; IP addresses are
not ours to promise, so build the rule on the hostname.

---

## 12. Suggested article structure

Salesforce's article is one long page with a short "we discourage this, here's the better way"
preamble followed by reference tables. That shape fits, with one addition: an **at-a-glance minimum
list** up front, because most readers want three lines they can paste into a proxy config and leave.

1. **Who this is for** — one sentence. An IT or network admin allowing GlideOS through a firewall,
   proxy, or mail gateway.
2. **The short answer** — allow by domain, not by IP. The minimum set for the product to work.
3. **Domains to allow** — the platform table, then the published-apps table.
4. **WebSockets** — the `Upgrade`-header warning.
5. **Static assets and CDNs** — why an app renders blank without these.
6. **Sign-in and SSO** — the Descope hosts, then the SAML SP values for enterprise orgs.
7. **Email** — both sending domains, the auth facts, the subjects, the URL-scanning exemption, and
   the re-send step.
8. **Third-party services** — what degrades versus what breaks.
9. **Outbound connections from GlideOS** — for customers firewalling their own systems, and the
   token/mTLS recommendation.
10. **Ports and protocols** — 443, TLS 1.2, `wss://`.
11. **Why we don't publish IP ranges** — could also lead, per Salesforce. Writer's call.

### Editorial notes for the writer

- **Title:** title case, so *GlideOS Domains and IP Addresses to Allow*. H2 and below in sentence case.
- **"Allow", not "whitelist".** Salesforce made the same shift and their article title reflects it.
  Keep "whitelist" in the article's search metadata or a parenthetical on first mention, because it is
  what an admin will actually search for, then use "allow" and "allowlist" throughout.
- **No difficulty language.** No "simply add", "just allow", "straightforward". The style guide bans
  all of it, and this audience does not need reassurance.
- **No em dashes.** Style guide. This file uses them freely; the article must not.
- **Format every hostname as code.** Style guide's code convention, and it prevents transcription
  errors in a doc whose entire value is exact strings.
- **Present tense, active voice, second person.** "Allow `os.glideapps.dev`", not "`os.glideapps.dev`
  should be allowed".
- **Give the admin a table they can paste.** This is a reference page, not a lesson. Scannability
  beats prose.

### Verify in the live product before publishing

Per the 90% rule, none of these should ship on the strength of this file alone:

1. The exact custom-domain CNAME target string the product shows in **app_bind_custom_domain** / the
   custom-domain UI.
2. The magic-link and invite link hosts, read from real emails.
3. The current template subject lines.
4. The Datadog RUM intake hostname and the Intercom widget hosts, from a browser Network tab.
5. The complete asset-host list for a real published app, from a browser Network tab.
6. Minimum TLS version on the `glideapps.dev` and `glideos.app` zones, from the Cloudflare dashboard.
7. Whether in-app data WebSockets use the app hostname or anything else.
8. The UI path for **Settings → Single sign-on → Configure SSO**, exactly as labeled.

### Open questions for the team

- Is there a public status or changelog channel where hostname changes get announced? The stability
  section needs somewhere to point, and there is no obvious candidate in the repo.
- Should the article name Descope, PostHog, Datadog, Intercom, and Composio as subprocessors, or
  point at a trust/subprocessor page instead? Naming them is unavoidable for an allowlist article,
  but it should match whatever the security and legal pages already say.
- Does support want a copy-paste allowlist packet built from this page, so a ticket can be answered
  without rewriting the list each time?

---
