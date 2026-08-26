# Glide

This extension connects Gemini CLI to Glide's official MCP server, which exposes tools for building and operating GlideOS applications: creating and managing projects, working with app data and databases, running workflows, publishing apps, and more.

Guidance for working with these tools:

- Before writing or modifying GlideOS application code, read the app-building contract resource at `glideos://guidance/app-building-contract`. It is the canonical contract for how GlideOS apps are structured and must be followed.
- Additional in-depth GlideOS skills and capability guidance are available as MCP resources on this server. Read the relevant resources before doing work they govern.
- Most tools operate on a project. If the user has not identified a project, list their projects first and confirm which one to work in.
- Signing in happens through Glide's OAuth flow the first time a tool is used. The connected user's organization determines which projects and data are accessible.
