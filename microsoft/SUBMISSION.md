# Submitting the Glide MCP server to Microsoft Copilot

Internal guide for listing the Glide MCP server in Microsoft's connector catalog, so it appears in Microsoft Copilot Studio and Microsoft 365 Copilot. The public-facing documentation is [`intro.md`](intro.md); this file is for whoever runs the submission.

Microsoft certifies MCP servers through the **Power Platform connector certification program**. The server itself does not change — this directory is the connector package that describes it in Microsoft's format:

| File | Purpose |
| --- | --- |
| `apiDefinition.swagger.json` | OpenAPI 2.0 definition. For an MCP server this is a single `InvokeServer` operation tagged `x-ms-agentic-protocol: mcp-streamable-1.0`; Copilot Studio discovers the tools from the server at runtime. |
| `apiProperties.json` | Connection parameters (OAuth), publisher, and icon brand color. |
| `intro.md` | Public documentation. Microsoft generates the connector's reference page from it. |
| `icon.png` | 512×512 PNG of Glide's logo, rasterized from `plugins/glide/assets/logo.svg`. |

Reference: [Microsoft MCP server certification](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-server-certification) and [Prepare connector files for certification](https://learn.microsoft.com/en-us/connectors/custom-connectors/certification-submission). The file shapes here mirror the certified MCP connectors in [`microsoft/PowerPlatformConnectors`](https://github.com/microsoft/PowerPlatformConnectors/tree/dev/certified-connectors) (for example `zeroheight MCP` and `Seismic MCP`).

## Before you submit

Run the offline checker after every edit:

```bash
node scripts/validate-microsoft.mjs
```

It fails on structural problems and warns about every `REPLACE_WITH_…` placeholder still in the package. All placeholders must be gone before upload.

### 1. OAuth details (engineering)

The connector authenticates with Glide's own OAuth server. Microsoft's connector infrastructure does not support dynamic client registration, so Glide must issue Microsoft a **static OAuth client** and allow Microsoft's redirect URL.

- [ ] Register an OAuth client for Microsoft. Redirect URL: `https://global.consent.azure-apim.net/redirect`. Partner Center may issue a connector-specific redirect URL of the form `https://global.consent.azure-apim.net/redirect/<connector-id>` after the offer is created — if it does, allow that one too and update `redirectUrl` in `apiProperties.json`.
- [ ] Fill in `authorizationUrl`, `tokenUrl`, and `refreshUrl`. They are published by the server at `https://mcp.glideapps.dev/.well-known/oauth-authorization-server` (fields `authorization_endpoint` and `token_endpoint`).
- [ ] Fill in the scope(s) the client should request, in both files. If the server does not use scopes, ask Microsoft's certification contact how to express that — the certified examples all declare at least one.
- [ ] Put the client id in `apiProperties.json`. **Never commit the client secret.** It is uploaded separately in Partner Center (or with the ingestion server's `uploadCredentials` tool, which returns a safe reference).

### 2. Metadata (product / marketing)

- [ ] Privacy policy URL in `apiDefinition.swagger.json` → `x-ms-connector-metadata`.
- [ ] Confirm the support contact in `info.contact` (currently the plugin owner's email; a shared support address is better for a public listing).
- [ ] Confirm `Categories`. Microsoft's allowed values include `AI`, `Productivity`, `Data`, `Collaboration`, `IT Operations`, and `Business Management`; use one or two, separated by `;`.
- [ ] Review `intro.md`. The tool list was captured from the live server on 2026-09-15; re-check it against `tools/list` on `mcp.glideapps.dev` before submitting, and again on every resubmission.

### 3. Test account (support)

Microsoft manually exercises **every tool** with credentials you supply, and the MCP server feature is behind a paid plan. Provision:

- [ ] A Glide organization on a plan that includes the MCP server feature, dedicated to Microsoft's reviewers.
- [ ] At least one project with a deployed app, a database with a few tables, and a workflow, so every tool has something to operate on.
- [ ] Written configuration instructions to paste into the submission (sign-in steps, which project to use, which tools are safe to exercise destructively).

### 4. Partner Center

- [ ] Partner Center account has completed **business verification**.
- [ ] Enrolled in the **Microsoft 365 and Copilot** program.
- [ ] Whoever submits signs in with an account in the **seller-associated tenant** (the tenant linked to the Partner Center account) — accounts from other tenants are rejected.

## Submitting

Two ways to create the offer. Either way, choose the **Connectors and Agents for Microsoft Copilot Studio** offer type — MCP servers are certified through the same pipeline as connectors.

### Option A — Partner Center UI

1. Go to [Partner Center](https://partner.microsoft.com/dashboard/home) → **Marketplace offers** → **New offer** → **Connectors and Agents for Microsoft Copilot Studio**.
2. Fill in the offer's metadata, legal and support links, and logos.
3. Upload this directory's four files as the connector package.
4. Enter the OAuth client secret and the reviewer test credentials where prompted.
5. Submit for certification.

### Option B — Marketplace Ingestion MCP server

Microsoft runs an MCP server that drives the same submission from an AI agent. It works from **Visual Studio Code** or the **GitHub Copilot CLI** only (endpoint: `https://ingestion-mcp.marketplace-ingestion.mp.microsoft.com/mcp`). Sign in with Microsoft Entra ID from the seller-associated tenant, then ask the agent to create the offer; it calls `getSchema` → `buildPayload` → `validate` → `create`, and `uploadCredentials` for the OAuth secret. `getSchema` for this offer type is also the authoritative list of required fields if anything here is out of date.

Docs: [Marketplace Ingestion MCP server](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/ingestion-mcp).

## What Microsoft checks

1. **Automated validation** — schema correctness, metadata completeness, packaging integrity, baseline policy.
2. **Manual review** — every tool is exercised with the test credentials and compared against `intro.md`. Reviewers also look for secure endpoints, verified domain ownership, least-privileged access, and telemetry for auditing.
3. **Responsible AI evaluation** — normal, edge-case, and adversarial scenarios to validate safety and permission handling. The **Data handling and safety** section of `intro.md` documents the mitigations already built into the server (human confirmation for `bash`, `run_backend_code`, destructive SQL, restores, and deletes; dry runs; audit log). Submitting your own evidence of these behaviors is optional but Microsoft says it significantly speeds up review.

Note the endpoint is on `mcp.glideapps.dev` while the company domain is `glideapps.com`. Reviewers verify domain ownership; expect to prove control of both.

## After certification

Certification is ongoing. Microsoft requires that the live server stay aligned with the certified definition — **adding tools or making significant changes means resubmitting** the package. Assign an owner for that before the first submission. Documentation must stay accurate and support or compliance issues must be answered promptly; Microsoft monitors certified servers and can act on regressions.
