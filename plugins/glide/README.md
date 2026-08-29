# Glide

Cursor plugin that connects agents to [Glide](https://www.glideapps.com)'s official [Model Context Protocol](https://modelcontextprotocol.io/) server.

Build and operate GlideOS applications: create and manage projects, query and modify app databases, run workflows, publish apps, and more.

## Install

1. Open **Cursor Settings → Plugins**.
2. Search for **Glide**.
3. Click **Install**, then complete the Glide sign-in prompt.

Or run `/add-plugin glide` in chat.

## MCP

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

Auth is OAuth 2.1 against Glide. Cursor prompts for Glide sign-in when the plugin connects — there are no API keys to manage. Access requires a [Glide plan](https://www.glideapps.com/pricing) that includes the MCP server feature.

## What you can do

- **Projects** — create, list, and manage GlideOS projects
- **Apps** — publish, promote, roll back, and manage app access and domains
- **Data** — query and modify app databases, ingest data sources, manage backups
- **Workflows** — run workflows, manage schedules, webhooks, and triggers
- **Files & code** — read, write, and search project files; run backend code

Ask Cursor things like:

> "List my Glide projects"
>
> "Show me the tables in my app's database"

## Rules

- `glideos-development` — points the agent at the GlideOS app-building contract, project selection, and confirmation before destructive operations.

## Docs

- Glide MCP setup: https://www.glideapps.com/docs/os/mcp
- Glide documentation: https://www.glideapps.com/docs

## Logo

Glide's official symbol: the white mark on the `#1F2024` brand tile, sized 288×288 so it reads well in the Cursor UI.

## License

MIT
