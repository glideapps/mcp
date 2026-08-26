# Glide extension for Gemini CLI

Connect [Gemini CLI](https://geminicli.com) to [Glide](https://www.glideapps.com)'s official MCP server and build, manage, and operate GlideOS apps, data, and workflows from your terminal.

## Installation

```bash
gemini extensions install https://github.com/glideapps/glide-gemini-extension
```

Then restart Gemini CLI.

## Authentication

The first time you use a Glide tool, Gemini CLI opens Glide's sign-in flow in your browser (OAuth 2.0). Sign in with your Glide account and pick the organization to connect. Access to the MCP server requires a Glide plan that includes the MCP server feature.

## What you can do

The extension exposes Glide's full MCP tool surface, including:

- **Projects** — create, list, and manage GlideOS projects
- **Apps** — publish, promote, roll back, and manage app access and domains
- **Data** — query and modify app databases, ingest data sources, manage backups
- **Workflows** — run workflows, manage schedules, webhooks, and triggers
- **Files & code** — read, write, and search project files; run backend code

Ask Gemini things like:

> "List my Glide projects"
>
> "Create a new project called Inventory Tracker"
>
> "Show me the tables in my app's database"

## Support

- Glide documentation: https://www.glideapps.com/docs
- Issues with this extension: open an issue on this repository

## License

MIT
