# MCP server change: citation links for Microsoft 365 Copilot

## Why

Certification round 2 failed on this:

> Agent does not provide valid, rich citations. […] Conversation starters and all functions do not display rich citations that enable users to identify the source of the generated information.

It's a must-fix in the [Agent Store validation guidelines](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/prepare/review-copilot-validation-guidelines#agent-response): "All agents and plugins must provide rich responses that clearly describe the action performed and include citations that allow users to identify the source of the response."

## How Copilot builds a citation

From [Show citations with response semantics](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-citations), zero-config fallback section:

- Copilot parses the JSON in each tool result's text content and looks for these field names (first match wins):
  - **URL, required:** `display_url`, `displayUrl`, `web_url`, `webUrl`, `url`, `citation_url`, `citationUrl`, `reference_url`, `referenceUrl`, `website_url`, `websiteUrl`, `web_link`, `webLink`, `link`, `href`. No URL means no citation.
  - **Title:** `display_title`, `displayTitle`, `title`, `name`, `display_name`, `displayName`, `web_title`, `webTitle`, `subject`, `heading`, `caption`. Falls back to the URL's hostname.
  - **Subtitle, optional:** `subtitle`, `description`, `summary`, `snippet`, `source`, `provider`, `site_name`, `siteName`, `highlight`
- For lists, it reads the array under `results`, `items`, `data`, `value`, `records` or `entries` and makes one citation per item.
- The URL has to be a link the user can open.

## What the server returns today

Checked against the live server:

- `project_list`, `project_get` and `project_search`: no URL.
- `app_get` and `app_list`: `production_url`, which isn't a recognized name. It's also missing for apps that were never published.
- `db_list_tables` and `list_workflow_apps`: no URL.
- List tools put items under `projects` or `apps`, which aren't recognized list keys.

## What to change

1. Any tool result tied to a project gets:
   - `url`: a link that opens the project in Glide OS. The confirmed format is the org's projects page, `https://os.glideapps.dev/o/{orgId}/projects`. If a page for a single project exists, use it instead.
   - `title`: the project name, or the app, table or workflow name.
2. List results return items under `results`, or add `results` next to the existing key so current clients don't break. Each item gets its own `url` and `title`.
3. Order of work:
   - The tools behind the conversation starters first: `project_list`, `db_list_tables`, `list_workflow_apps`, `app_runtime_errors`, `project_create`.
   - Then every other tool. The reviewer said "all functions".

## Needs your input

Whether a URL for a single project exists. If it does, each project's results can link to their own project. If not, every result links to the org's projects page.

## Package impact

None. The Microsoft 365 package doesn't change, and Copilot reads the new fields automatically at runtime. Once it's deployed, we'll confirm the citations show up in Copilot before resubmitting.
