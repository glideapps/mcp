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
| `gemini-extension.json`, `GEMINI.md` | Gemini CLI extension | Gemini CLI |

Validate the Cursor plugin manifests with:

```bash
node scripts/validate-template.mjs
```

## Support

- Glide documentation: https://www.glideapps.com/docs
- Product questions and account help: https://www.glideapps.com/support
- Bugs in the Cursor plugin, Gemini CLI extension, or Agent Plugin manifests, or errors in this README: open an issue on this repository

## License

MIT
