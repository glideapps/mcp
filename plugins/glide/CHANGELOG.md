# Changelog

All notable changes to this plugin will be documented here.

## 1.1.0

- Packaged the plugin for Grok Build as well as Cursor: added `.grok-plugin/plugin.json` and `.mcp.json`.
- Added a `glideos-development` skill mirroring the Cursor rule, for clients that load `skills/` instead of `rules/`.

## 1.0.0 — initial release

- Logo: Glide's official symbol, the white mark on the round black badge.
- Added the `glide` MCP server pointing at `https://mcp.glideapps.dev/mcp` over streamable HTTP.
- Authentication is OAuth 2.1; Cursor prompts for Glide sign-in when the plugin connects.
- Added a `glideos-development` rule covering the app-building contract, project selection, and destructive operations.
