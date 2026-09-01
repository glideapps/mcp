# Glide MCP Server

Connect your AI tools to [Glide](https://www.glideapps.com)'s official MCP server and build, manage, and operate GlideOS apps, data, and workflows — from Claude, Cursor, VS Code, Gemini CLI, ChatGPT, or any MCP client.

- **Endpoint:** `https://mcp.glideapps.dev/mcp` (Streamable HTTP)
- **Authentication:** OAuth 2.1 — sign in with your Glide account when your client prompts you; no API keys to manage. Access requires a [Glide plan](https://www.glideapps.com/pricing) that includes the MCP server feature.
- **Documentation:** https://www.glideapps.com/docs/os/mcp

## What you can do

The server exposes Glide's full MCP tool surface, including:

- **Projects** — create, list, and manage GlideOS projects
- **Apps** — publish, promote, roll back, and manage app access and domains
- **Data** — query and modify app databases, ingest data sources, manage backups
- **Workflows** — run workflows, manage schedules, webhooks, and triggers
- **Files & code** — read, write, and search project files; run backend code

Ask your AI tool things like:

> "List my Glide projects"
>
> "Create a new project called Inventory Tracker"
>
> "Show me the tables in my app's database"

## Setup

### Claude Code

```bash
claude mcp add --transport http glide https://mcp.glideapps.dev/mcp
```

### Claude (web and desktop)

Go to **Settings → Connectors → Add custom connector** and enter `https://mcp.glideapps.dev/mcp`.

### Cursor

Install the **Glide** plugin from the Cursor Marketplace: open **Settings → Plugins**, search for **Glide**, and click **Install**. Or run `/add-plugin glide` in chat.

The plugin lives in [`plugins/glide`](plugins/glide) and requires Cursor 3.13.0 or later.

To configure the MCP server manually instead:

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=glide&config=eyJ1cmwiOiJodHRwczovL21jcC5nbGlkZWFwcHMuZGV2L21jcCJ9)

Or add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "glide": {
      "type": "http",
      "url": "https://mcp.glideapps.dev/mcp"
    }
  }
}
```

### Grok Build

The [`plugins/glide`](plugins/glide) directory doubles as a Grok Build plugin: `.grok-plugin/plugin.json`, `.mcp.json`, and a `glideos-development` skill. Install it from Grok Build's plugin marketplace once the catalog entry is merged — see [Listing in the xAI plugin marketplace](#listing-in-the-xai-plugin-marketplace).

### Docker Desktop (MCP Toolkit)

Glide is submitted to the [Docker MCP Catalog](https://hub.docker.com/mcp) as a remote server. Once the catalog entry is merged, enable it from **Docker Desktop → MCP Toolkit → Catalog**, search for **Glide**, and click **+**. Then authorize it:

```bash
docker mcp server enable glide
docker mcp oauth authorize glide
```

The submission files live in [`registries/docker/servers/glide`](registries/docker/servers/glide) — see [Listing in the Docker MCP Catalog](#listing-in-the-docker-mcp-catalog).

### VS Code

```bash
code --add-mcp '{"name":"glide","type":"http","url":"https://mcp.glideapps.dev/mcp"}'
```

### Gemini CLI

This repository is also a Gemini CLI extension:

```bash
gemini extensions install https://github.com/glideapps/mcp
```

Then restart Gemini CLI.

### ChatGPT

In **Settings → Connectors**, add a custom connector with the URL `https://mcp.glideapps.dev/mcp` (requires a ChatGPT plan with connector support).

## Repository layout

This repo packages the same MCP server for several agent ecosystems:

| Path | Format | Used by |
| --- | --- | --- |
| `.cursor-plugin/marketplace.json`, `plugins/glide/` | Cursor plugin | Cursor Marketplace |
| `plugin.json`, `mcp.json` | [Agent Plugin](https://agent-plugins.org) | Agent Plugin clients |
| `plugins/glide/.grok-plugin/plugin.json`, `plugins/glide/.mcp.json` | Grok Build plugin | Grok Build (xAI plugin marketplace) |
| `gemini-extension.json`, `GEMINI.md` | Gemini CLI extension | Gemini CLI |
| `registries/docker/servers/glide/` | Docker MCP Catalog entry | Docker MCP Toolkit (Docker Desktop) |

Validate the Cursor plugin manifests with:

```bash
node scripts/validate-template.mjs
```

### Listing in the xAI plugin marketplace

Grok Build installs plugins from [`xai-org/plugin-marketplace`](https://github.com/xai-org/plugin-marketplace). Listing is one PR to that repo that adds a remote entry pointing at `plugins/glide` in this repo, pinned to an exact commit:

```json
{
  "name": "glide",
  "description": "Glide's official MCP server. Build, manage, and operate GlideOS apps: create and manage projects, query and modify app databases, run workflows, publish and roll back apps, and read, write, and search project files.",
  "category": "development",
  "source": {
    "source": "url",
    "url": "https://github.com/glideapps/mcp.git",
    "sha": "<40-character commit SHA>",
    "path": "plugins/glide"
  },
  "homepage": "https://www.glideapps.com/docs/os/mcp",
  "keywords": ["glide", "glideos", "glide apps", "glideapps"],
  "domains": ["glideapps.com"]
}
```

Get the commit to pin (a full 40-character lowercase SHA — branches, tags, and short SHAs are rejected):

```bash
git ls-remote https://github.com/glideapps/mcp.git HEAD
```

Then, in a fork of the marketplace repo, add the entry to `.grok-plugin/marketplace.json` and run what CI runs before opening the PR:

```bash
python3 scripts/generate-plugin-index.py
python3 scripts/validate-catalog.py
python3 scripts/generate-plugin-index.py --check
```

To ship a plugin update after this repo changes, bump the pinned `sha` in that entry and regenerate the index — don't open a second entry.

### Listing in the Docker MCP Catalog

Docker's MCP Toolkit installs servers from [`docker/mcp-registry`](https://github.com/docker/mcp-registry). Listing is one PR to that repo that adds a `servers/glide/` entry. Glide is a **remote** server, so the entry needs no Docker image — just three files, staged in this repo under [`registries/docker/servers/glide`](registries/docker/servers/glide):

| File | Contents |
| --- | --- |
| `server.yaml` | `type: remote`, the streamable-HTTP endpoint, and the OAuth provider block |
| `tools.json` | `[]` — remote servers use dynamic tool discovery |
| `readme.md` | A link to the Glide MCP documentation |

`dynamic.tools: true` is required for any entry with an `oauth` block, which is why `tools.json` stays empty.

To submit, copy the staged directory into a fork of the registry and run what CI runs:

```bash
git clone https://github.com/<your-fork>/mcp-registry.git
cp -r registries/docker/servers/glide /path/to/mcp-registry/servers/glide

cd /path/to/mcp-registry
task validate -- --name glide
task catalog -- glide
```

Optionally verify end to end against Docker Desktop before opening the PR:

```bash
docker mcp catalog import $PWD/catalogs/glide/catalog.yaml
docker mcp server enable glide
docker mcp oauth authorize glide
docker mcp gateway run
docker mcp catalog reset   # when done
```

Then open the PR using the registry's `.github/PULL_REQUEST_TEMPLATE.md`. Reviewers need a working Glide account to test the OAuth flow, since the MCP server requires a [Glide plan](https://www.glideapps.com/pricing) that includes it — share test credentials through the [form linked in the template](https://forms.gle/6Lw3nsvu2d6nFg8e6) rather than in the PR.

To ship a change after this repo updates, edit the staged files here and open a follow-up PR to the registry with the same `servers/glide/` path — don't add a second entry.

## Support

- Glide documentation: https://www.glideapps.com/docs
- Product questions and account help: https://www.glideapps.com/support
- Bugs in the Cursor plugin, Grok Build plugin, Gemini CLI extension, or Agent Plugin manifests, or errors in this README: open an issue on this repository

## License

MIT
