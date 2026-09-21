# Submitting the Glide MCP server to Microsoft 365 Copilot

Internal guide for listing Glide in the **Agent Store** of Microsoft 365 Copilot and the **Apps** store of Teams, Outlook, Word, Excel, and PowerPoint. This directory is the Microsoft 365 app package that Partner Center certifies; the server itself does not change.

## Which Microsoft program this is

Several Microsoft programs have near-identical names. This package is for exactly one of them.

| What you are looking at | Is it this package? | Notes |
| --- | --- | --- |
| Partner Center program **Microsoft 365 and Copilot** (formerly the Office Store program), offer type **Apps and agents for Microsoft 365 and Copilot** | **Yes** | Partner Center's **New offer** picker labels it "Microsoft 365 and Copilot App or Agent". You upload this directory's zip as the app package. |
| Offer type **Microsoft Copilot Studio Connector or Agent** (Power Platform connector certification) | No | That is the sibling package in `microsoft/` on branch `claude/hopeful-newton-qid0va`. Same server, different program, different files. |
| Offer type **AI app or agent** (Azure Marketplace, under the Commercial Marketplace program) | No | For Azure-hosted AI apps sold through Azure Marketplace. Not for the Agent Store. |
| **Microsoft Agent 365** submission | No | A different offer type for agents extended with Agent 365 observability. Do not bundle it with this offer (validation guideline 12). |
| **Microsoft 365 Developer Program** | No | Gives you a sandbox tenant for testing. It is not a publishing program. |
| **Microsoft 365 App Compliance Program** (Publisher Attestation, Microsoft 365 Certification) | Not yet | Optional compliance tiers you complete in Partner Center after the app is listed. See [After certification](#after-certification). |
| **Federated Copilot connector** | No | Microsoft Form plus a business-development engagement; read-only tools only. |

Verified against Microsoft's docs on 2026-09-17: [Publish agents for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/publish) names the program and the offer type; [Register MCP servers as agent connectors](https://learn.microsoft.com/en-us/microsoftteams/platform/m365-apps/agent-connectors) is the manifest reference.

## What is in the package

| File | Purpose |
| --- | --- |
| `manifest.json` | Microsoft 365 app manifest (schema v1.29). Declares the developer, store listing text, icons, the declarative agent, and the **agent connector** that registers `https://mcp.glideapps.dev/mcp` under `agentConnectors[].toolSource.remoteMcpServer` with dynamic tool discovery and `DynamicClientRegistration` authorization. |
| `declarativeAgent.json` | Declarative agent (schema v1.8): name, description, instructions, conversation starters, and one action that points at `ai-plugin.json`. This is what users see as **Glide** in the Agent Store. |
| `ai-plugin.json` | Plugin manifest (schema v2.4) with a `RemoteMCPServer` runtime, `functions: []`, and `run_for_functions: ["*"]`, which is Microsoft's shape for dynamic tool discovery. Auth is `OAuthPluginVault` with the auth config id that dynamic client registration produces. |
| `color.png` | 192x192 color icon. Glide's symbol from `plugins/glide/assets/logo.svg`, rendered into the 120x120 safe region on a transparent background, per Microsoft's icon guidance. Same artwork as `microsoft/icon.png` in the sibling package. |
| `outline.png` | 32x32 white outline icon on a transparent background. Required by validation even though Copilot does not show it. |

`glide-microsoft-365.zip` is the upload. It is git-ignored; build it with the checker below. Every file sits at the zip root.

### Two decisions to know about

**Manifest schema is v1.29, not v1.27.** The agent-connectors article shows v1.27, but the published JSON schemas for v1.27 and v1.28 make `mcpToolDescription` a required property of `remoteMcpServer`, which means those versions cannot express dynamic tool discovery for a connector. v1.29 makes it optional and its description matches the article ("omit it for dynamic discovery"). Microsoft's [dynamic tool discovery article](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-dynamic-tool-discovery) says the same: agent connectors need app manifest 1.29 or later for dynamic discovery. `node scripts/validate-m365.mjs` fails if the version drops below 1.29 without pinned tools. If Partner Center rejects 1.29 for any reason, the fallback is v1.27 with a `toolDescription.json` captured from the server's `tools/list` and referenced from `mcpToolDescription.file`, at the cost of resubmitting whenever tools change.

**Dynamic client registration is confirmed.** Checked on 2026-09-17 against the live metadata: `https://mcp.glideapps.dev/.well-known/oauth-protected-resource/mcp` names `https://mcp.glideapps.dev` as the authorization server, and `https://mcp.glideapps.dev/.well-known/oauth-authorization-server` publishes `registration_endpoint` (`https://mcp.glideapps.dev/register`), grant types `authorization_code` and `refresh_token`, PKCE `S256`, and token endpoint auth methods `client_secret_basic`, `client_secret_post`, and `none`. Scopes are `mcp:tools`, `openid`, and `email`. Microsoft's remaining requirement is that registration returns a `client_secret`; Agents Toolkit performs the registration in step 1 below and fails visibly if it does not. Should that ever happen, the fallback is static OAuth: register a client for Microsoft with redirect URL `https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect`, create an OAuth auth config in the Teams Developer Portal, and set `authorization.type` to `OAuthPluginVault` in `manifest.json`. `ai-plugin.json` already uses `OAuthPluginVault`; only the auth config id changes.

### Test results so far (2026-09-17, tenant glideos.onmicrosoft.com)

A throwaway Agents Toolkit project with the same plugin shape was provisioned and tested in Microsoft 365 Copilot Chat (account without a Copilot license; custom app upload enabled). Findings:

- Provisioning passed every step, including `dcr/register` against `https://mcp.glideapps.dev/register` (registration returns a `client_secret`).
- **Dynamic tool discovery did not surface any tools.** With `functions: []` and `run_for_functions: ["*"]`, the agent reported it had no tools and never showed a sign-in card. Anonymous `initialize` and `tools/list` on the server return 401 with a correct `WWW-Authenticate` challenge, which is the expected MCP behavior, so this is either a Copilot Chat limitation for unlicensed accounts or a platform-side discovery issue. Not yet resolved.
- **Pinned tools do trigger sign-in.** With `project_list` pinned in `mcp_tool_description`, Copilot showed the sign-in card and redirected to Glide's authorize page. Sign-in at Glide succeeded.
- **The token exchange then failed on Microsoft's redirect page** (`Something went wrong. Please try again.`, RequestId `RoutingAdded-84963fe0-b8fa-4bcf-867a-45a1b677e873`, 2026-09-17T19:50:02Z). **Root-caused and fixed.** Microsoft authenticates at `/token` with an HTTP Basic header *and* repeats `client_id` in the form body. The OAuth provider read that as mixed authentication and answered `400 invalid_request`. The server now drops the redundant body `client_id` when, and only when, the client is registered for `client_secret_basic` and exactly one unambiguous Basic credential decodes to the same id; every other shape still reaches the provider for rejection, and secret, PKCE, code, redirect, scope, and grant validation are unchanged. See glideapps/g3#14850, merged and deployed 2026-09-18. Re-test with a fresh authorization code; the existing registration still applies.
- **End-to-end sign-in and tool call confirmed on 2026-09-21**, after the fix deployed. With `project_list` pinned, Copilot showed the sign-in card, the Glide sign-in completed, and the agent answered with the signed-in user's real project list (692 active projects). Sign-in, token exchange, tool invocation, and the response path all work.
- Note on chat sessions: a conversation that started before sign-in keeps its empty tool list. Start a new chat after signing in, or the agent keeps reporting that it has no tools.

- A diagnostic client named `m365-diagnostic` (`client_id` `lsM7QVFNQ64113CP`) was registered during troubleshooting and never used; revoke it if registrations are tracked.

Until both items are resolved, the fallback for submission is pinned tools: capture `tools/list` from the server into `toolDescription.json`, reference it from `mcpToolDescription.file` in `manifest.json` and `mcp_tool_description.file` in `ai-plugin.json`, and list the pinned tools in `functions` and `run_for_functions`. The checker currently rejects that shape on purpose; relax it when the decision is made.

## Before you submit

Run the offline checker after every edit:

```bash
node scripts/validate-m365.mjs        # checks only
node scripts/validate-m365.mjs --zip  # checks, then builds microsoft-365/glide-microsoft-365.zip
```

It fails on structural problems and warns about every `REPLACE_WITH_…` placeholder still in the package. All placeholders must be gone before upload.

### 1. OAuth (engineering)

- [x] Dynamic client registration confirmed from the server's metadata (see above).
- [x] Auth config created on 2026-09-17 by provisioning a throwaway Agents Toolkit project against the server; its id is in both files. The Teams Developer Portal does not support DCR yet, so use **Microsoft 365 Agents Toolkit** (6.12.0 or later) in Visual Studio Code: **Create a New Agent/App** → **Declarative Agent** → **Add an Action** → **Start with an MCP Server** → enter `https://mcp.glideapps.dev/mcp` → **OAuth (with dynamic registration)**. The toolkit registers the client, stores the auth config in the Microsoft Enterprise token store, and writes the id into the generated `ai-plugin.json`.
- [x] Auth config id copied into both files (`manifest.json` → `agentConnectors[0]…authorization.referenceId` and `ai-plugin.json` → `runtimes[0].auth.reference_id`). If Microsoft issues separate ids for the connector and the plugin, use each where it belongs; the checker only warns when they differ.
- [ ] Sideload the zip into a test tenant (Agents Toolkit **Provision**, or Teams admin center → upload a custom app) and run every conversation starter in `declarativeAgent.json`. All of them must return a real answer; Microsoft checks each one.
- [ ] Confirm the server serves TLS 1.2 or higher and that `tools/list` returns a `name`, `description`, and `inputSchema` for every tool (validation guideline 17 and the connector article).

### 2. Listing (product and marketing)

Partner Center collects the store listing outside the package. The manifest's `name`, `description.short`, and `description.full` must match what you enter there.

- [x] Privacy policy `https://www.glideapps.com/legal/privacy` and terms `https://www.glideapps.com/legal/terms` in `manifest.json` and `ai-plugin.json`.
- [x] Support contact `support@glideapps.com` in `ai-plugin.json`.
- [ ] Screenshots: up to five, 1366x768, under 1024 KB each. At least one must show the agent inside Microsoft 365 Copilot (validation guideline 3).
- [ ] Optional demo video (YouTube or Vimeo link).
- [ ] Category, markets, and pricing (the agent itself is free; access is gated by the user's Glide plan).
- [ ] Re-read `description.full` in `manifest.json` against the live tool list before every submission. It summarizes the tools captured from `mcp.glideapps.dev` on 2026-09-15 (the same list as `microsoft/intro.md`).

### 3. Test account (support)

Microsoft reviewers exercise the agent with credentials you supply, and the MCP server feature is behind a paid plan.

- [ ] A Glide organization on a plan that includes the MCP server feature, dedicated to Microsoft's reviewers.
- [ ] At least one project with a deployed app, a database with a few tables, and a workflow, so every conversation starter has something to answer.
- [ ] Test notes for the submission form: sign-in steps, which project to use, which tools require human confirmation and why, and which tools are safe to run destructively.

### 4. Partner Center

- [ ] A Partner Center account whose **business verification** is complete. A Microsoft AI Cloud Partner Program account works; registration for this program is free.
- [ ] Enrolled in the **Microsoft 365 and Copilot** program: Partner Center → **Settings** → **Account settings** → **Programs** → **Microsoft 365 and Copilot** → **Get started**.
- [ ] **Publisher verification** complete (required for apps listed in the store).
- [ ] Whoever submits signs in with an account in the seller-associated tenant.

## Submitting

1. Go to [Partner Center](https://partner.microsoft.com/dashboard/home) → **Marketplace offers** → **New offer** → **Microsoft 365** → **Microsoft 365 and Copilot App or Agent** (the docs call this offer type **Apps and agents for Microsoft 365 and Copilot**).
2. Upload `glide-microsoft-365.zip` as the app package. Partner Center reads the manifest and pre-fills the listing.
3. Complete the listing (screenshots, video, category, markets) and the availability and pricing pages.
4. Paste the test notes and reviewer credentials into the certification notes.
5. Submit for validation.

Microsoft's validation team sends the report and any remediation steps by email from the Teams submission concierge. Allow at least one business day after approval for the listing to appear.

## What Microsoft checks

The checks that apply to this package, from the [Agent Store validation guidelines](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/prepare/review-copilot-validation-guidelines) and [Responsible AI validation](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/rai-validation):

1. **Value.** The agent must do something Copilot cannot do on its own. Glide qualifies: it operates a customer's GlideOS workspace.
2. **Descriptions.** No URLs, emojis, instructional phrases, or superlatives in any description field, including `description_for_model`. The checker rejects URLs.
3. **Name.** `name.short` in `manifest.json`, `name` in `declarativeAgent.json`, and `name_for_human` in `ai-plugin.json` must be identical. All three are `Glide`.
4. **Prompts.** At least three conversation starters, each 128 characters or fewer, no duplicates, and every one must work. The package ships five.
5. **Actions.** Tools that change data need clear user disclosure and confirmation. The server enforces human approval for its high-impact tools, and the agent instructions require confirmation before any change; describe both in the test notes.
6. **Security.** HTTPS with TLS 1.2 or higher, no redirects, and the server domain must be one Glide owns. `validDomains` lists `mcp.glideapps.dev` and `www.glideapps.com`; expect to prove control of both.
7. **Responsible AI.** Manifest validation rejects names, descriptions, or instructions that encourage harm, provoke arguments, try to bypass guidelines, or reproduce copyrighted material. With dynamic tool discovery, Microsoft also screens every newly discovered or changed tool at runtime with Responsible AI and cross-prompt-injection classifiers before it is activated.
8. **Performance.** 99.9 percent availability; responses within nine seconds at the 99th percentile.

## After certification

- **Publisher Attestation** (Partner Center → **Microsoft 365 and Copilot** → **App Compliance**) is required once the app is listed, and before any update is submitted. It is a self-assessment questionnaire.
- **Microsoft 365 Certification** is optional and builds on the attestation.
- **Tool changes do not need a resubmission.** Dynamic tool discovery picks up new, changed, and removed tools at runtime after Microsoft's runtime checks pass. Resubmit when the listing text, icons, instructions, conversation starters, auth config, or server URL change.
- Assign an owner to keep `description.full` in `manifest.json` aligned with what the server actually offers, and to answer Microsoft's support and compliance emails.
