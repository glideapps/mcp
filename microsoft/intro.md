# Glide

The Glide connector lets Microsoft Copilot Studio agents and Microsoft 365 Copilot build, manage, and operate [GlideOS](https://www.glideapps.com) apps through the Model Context Protocol (MCP). Agents discover tools at runtime and use them to create and manage projects, query and modify app databases, run workflows, publish and roll back apps, and read, write, and search project files.

## Publisher: Glide

## Prerequisites

- A Glide account on a [plan that includes the MCP server feature](https://www.glideapps.com/pricing).
- Microsoft Copilot Studio with **generative orchestration** and **MCP tools** enabled in your environment.

## Supported Operations

Tools are discovered from the server at runtime, so the set below may grow over time. Every tool operates within the signed-in user's Glide organization and honors that user's role (admin, editor, or viewer) — an agent can never reach a project the user could not open themselves.

Tools marked **(confirmation required)** refuse to run until a human explicitly approves that specific call. See [Data handling and safety](#data-handling-and-safety).

### Projects

- **project_list** — List all projects in the user's organization.
- **project_search** — Find projects by name, by the name of an app inside them, or by what a chat about them was called.
- **project_lookup** — Look up a single project by id.
- **project_get** — Get a project's name, organization, and creation date.
- **project_create** — Create a new project.
- **project_rename** — Rename a project.
- **project_set_accent_color** — Set the project's brand (accent) color.
- **project_delete** — Soft-delete one or more projects. **(confirmation required)**

### Apps

- **app_list** — List the apps in a project with their status, URL, and version.
- **app_get** — Get details of one app by slug.
- **app_list_versions** — Show an app's deploy history.
- **app_authenticated_link** — Create a pre-authenticated link to an app for testing or screenshots.
- **app_runtime_errors** — Read build, client-runtime, and server-error history for the current preview.
- **app_request_read** — Make a GET/HEAD/OPTIONS request to the project's own app backend to verify an endpoint.
- **app_request_write** — Make a POST/PUT/PATCH/DELETE request to the project's own app backend.
- **update_preview** — Build and deploy the preview version of an app or workflow.
- **app_publish** — Promote a preview version to production.
- **app_promote** — Promote a specific past version to production.
- **app_rollback** — Roll production back to a previous version.
- **app_set_name** — Rename an app's user-facing name.
- **app_set_icon** — Set an app's icon from a description or an uploaded image.
- **app_set_access** — Set who can open the app: organization members, anyone signed in, or anyone with the link. **(confirmation required)**
- **app_claim_vanity_slug** — Claim a `*.glideapps.dev` vanity subdomain for an app.
- **app_release_vanity_slug** — Release a vanity subdomain.
- **app_bind_custom_domain** — Bind a customer-owned domain to an app (requires DNS ownership verification).
- **app_unbind_custom_domain** — Remove a custom domain from an app.
- **app_custom_domain_status** — Check whether a custom domain's certificate is active, provisioning, or blocked.
- **add_app_assets** — Promote uploaded files into the app's asset storage and return app-local paths.
- **ui_add_glide_components** — Install Glide design-system components into an app.
- **app_delete** — Delete an app and its deployment.

### Data

- **db_list** — List the databases provisioned for a project.
- **db_get** — Get details for a project database.
- **db_list_tables** — List tables and views with their column schemas and comments.
- **db_select** — Run a single read-only `SELECT` against the project database (capped at 1,000 rows).
- **db_execute** — Run any SQL statement, including writes and DDL; destructive statements require confirmation. **(confirmation required)**
- **db_ingest_data_source** — Bulk-load a CSV, JSON, or XLSX attachment into an existing table.
- **db_backup_status** — Show whether the database is provisioned and its restore history window.
- **db_backup_list** — List database backups.
- **db_backup_create** — Create a read-only backup from a timestamp or LSN.
- **db_backup_connection** — Return a read-only connection string for a backup.
- **db_backup_delete** — Delete a backup.
- **db_restore_from_backup** — Restore the live database from a backup; the current state is preserved first. **(confirmation required)**
- **db_restore_to_point** — Restore the live database to a point in time; the current state is preserved first. **(confirmation required)**

### Files

- **file_list** — List files in the project workspace.
- **file_read** — Read a file, a line range, or a historical version of a file.
- **file_search** — Search file contents by text or regex.
- **file_stat** — Check whether a file exists and get its size.
- **file_inspect** — Inspect an attachment: images are returned visually; PDFs, spreadsheets, CSV, and JSON are returned as text or structured data.
- **file_write** — Write or overwrite a file.
- **file_edit** — Apply exact in-place replacements to a file.
- **file_copy** — Copy a file.
- **file_move** — Move or rename a file.
- **file_delete** — Delete a file.
- **file_history** — List the mutation history of workspace files; any prior state can be restored.
- **file_restore** — Restore one file to a previous state.
- **workspace_restore** — Point-in-time restore of a directory subtree.

### Workflows

- **list_workflow_apps** — List workflows with their enabled state.
- **set_workflow_enabled** — Enable or disable an entire workflow.
- **run_workflow** — Run a workflow once, on demand.
- **list_workflow_runs** — List recent runs with status and errors.
- **get_workflow_run** — Inspect one run: input, per-step results, and failures.
- **get_workflow_step_output** — Read the full output of one step, or the run's input or final output.
- **cancel_workflow_run** — Stop an in-flight run.
- **create_workflow_schedule** — Schedule a workflow to run on a cron cadence or once at a future time.
- **list_workflow_schedules** — List schedules.
- **update_workflow_schedule** — Edit a schedule in place.
- **set_workflow_schedule_enabled** — Pause or resume one schedule.
- **remove_workflow_schedule** — Delete a schedule.
- **create_workflow_webhook** — Give a workflow a public URL that starts a run on POST.
- **list_workflow_webhooks** — List webhooks.
- **rotate_workflow_webhook** — Regenerate a webhook URL.
- **set_workflow_webhook_enabled** — Pause or resume a webhook without changing its URL.
- **set_workflow_webhook_header_auth** — Require a secret header on webhook requests.
- **delete_workflow_webhook** — Delete a webhook.
- **create_workflow_app_trigger** — Allow an app's server code to start a workflow.
- **list_workflow_app_triggers** — List app triggers.
- **set_workflow_app_trigger_enabled** — Pause or resume an app trigger.
- **delete_workflow_app_trigger** — Delete an app trigger.

### Integrations and event triggers

- **integration_search** — Find the right third-party integration tools for a task, with connection status and guidance.
- **integration_actions** — Get the full input schema for specific integration tools.
- **list_triggers** — List the event triggers a connected integration offers.
- **enable_trigger** — Make an external event start a workflow.
- **list_active_triggers** — List live integration triggers.
- **set_trigger_enabled** — Pause or resume a live trigger.
- **delete_trigger** — Remove a live trigger.

### Code execution and diagnostics

- **bash** — Run a short shell script in a sandbox mounted on the project workspace. **(confirmation required)**
- **run_backend_code** — Run a snippet of server-side JavaScript in the project's backend runtime for testing and debugging. **(confirmation required)**
- **log_query** — Query recent debug logs for a project.
- **log_clear** — Clear the debug log buffer.
- **ai_models_list** — List the AI models available to deployed apps.
- **ai_query_usage** — Query AI usage logs for a project's deployed apps.
- **resource_list** — List the infrastructure resources provisioned for a project.
- **secret_list** — List project secret names and descriptions (values are never returned).
- **secret_delete** — Delete a project secret.

### Spreadsheets

Read-only inspection of uploaded Excel workbooks. Macros are never executed.

- **spreadsheet_list_features** — Survey a workbook's sheets, charts, images, comments, tables, controls, page setup, and pivots.
- **spreadsheet_grep** — Search all cells for a pattern.
- **spreadsheet_inspect_range** — Inspect a cell range with data and formatting.
- **spreadsheet_extract_assets** — Extract embedded images to workspace files.
- **spreadsheet_list_macros** — List VBA modules in a macro-enabled workbook.
- **spreadsheet_read_macro_source** — Read the source of one VBA module.
- **spreadsheet_read_cell_comment** — Read a cell comment or note and its replies.
- **spreadsheet_read_pivot_definition** — Read a pivot table's definition.
- **spreadsheet_read_table_definition** — Read an Excel table's column definitions.

### Account, access, and audit

- **auth_whoami** — Return the verified identity, organization, and correlation ids for the current call.
- **auth_check** — Dry-run an authorization check without executing anything.
- **auth_list_actions** — List every registered tool with its read-only, destructive, and idempotent flags.
- **auth_audit_query** — Query the audit log of mutating and denied tool calls.
- **auth_audit_trace** — Reconstruct every tool call made within one turn by trace id.
- **org_member_role_lookup** — Look up the caller's role in their organization.
- **org_model_policy_lookup** — Look up the organization's AI model policy.
- **billing_lookup** — Look up the organization's plan, credits, and current pricing.

### App Store and feedback

- **suggest_apps** — Search the Glide App Store for installable templates.
- **use_app_store_app** — Install a published App Store app into a project.
- **send_feedback** — Send feedback about GlideOS to the Glide team.

## Obtaining Credentials

Authentication uses OAuth 2.0. A Glide account on a plan that includes the MCP server feature is required. No API keys or additional credentials are needed.

When adding the connector in Copilot Studio:

1. Select **Glide** from the connector gallery.
2. Click **Sign in** — you will be redirected to Glide to authenticate.
3. Grant the connector access to your Glide organization.
4. Once authorized, you will be returned to Copilot Studio and the connection will be active.

The connector only surfaces the projects, apps, and data that the authenticated user can access in Glide. Contact [Glide support](https://www.glideapps.com/support) if you need help confirming access or your plan.

## Getting Started

1. In Microsoft Copilot Studio, open your agent and go to **Tools**.
2. Search for **Glide** in the connector gallery and select it.
3. Sign in to your Glide account when prompted to create a connection.
4. Add the Glide tools you want the agent to use (for example, `project_list`, `db_select`, and `run_workflow`).
5. Test your agent by asking it to list your Glide projects or show the tables in an app's database.

## Data handling and safety

- **Scoped to the signed-in user.** Every call runs as the authenticated Glide user, within their organization, and is subject to that user's role. The connector cannot access other organizations.
- **Human confirmation for high-impact tools.** `bash`, `run_backend_code`, destructive `db_execute` statements, `db_restore_from_backup`, `db_restore_to_point`, `project_delete`, and `app_set_access` refuse to execute until a human explicitly approves that specific call. The confirmation is not inferred from context and cannot be pre-supplied by the agent on its own.
- **Dry runs.** Most mutating tools accept `dryRun: true` and return a plan of what would happen instead of executing.
- **Nothing is lost.** Every file write, edit, delete, move, and copy is recorded, and any prior state can be restored with `file_restore` or `workspace_restore`. Database restores preserve the current state as a backup before overwriting.
- **Secrets are write-only.** `secret_list` returns names and descriptions only; secret values are never returned to the agent.
- **Audit trail.** Every mutating call and every denied call produces an audit entry with the verified actor, delegation chain, and trace id, queryable with `auth_audit_query` and `auth_audit_trace`.
- **App access changes are explicit.** Making an app reachable by anyone with the link requires a fresh human confirmation of that specific change.

## Known Issues and Limitations

- Access requires a Glide plan that includes the MCP server feature. Users on other plans can sign in, but tool calls are refused.
- Query results from `db_select` and `db_execute` are capped at 1,000 rows or 256 KB per call; narrow the query or aggregate for larger reads.
- `bash` and `run_backend_code` are for testing and debugging, not for shipping app behavior; to change an app, edit its source and redeploy with `update_preview`.
- The `bash` sandbox is ephemeral: only changes under the mounted project workspace persist after the call returns.
- Tools are discovered at runtime. New tools may appear as GlideOS evolves; this page is updated when the certified definition is resubmitted.

## Frequently Asked Questions

### Can the connector delete data or apps?

Only with explicit approval. `project_delete`, database restores, and destructive SQL each require a human to confirm that specific call. File deletions are always recoverable through `file_history` and `file_restore`.

### Which of my Glide projects can an agent see?

Exactly the ones you can open yourself. The connector runs as you, in your organization, with your role.

### Does the connector need an API key?

No. Sign in with your Glide account through the OAuth flow when you create the connection.

## Deployment Instructions

This connector is submitted for Microsoft certification. Once certified, users can add it from the official connector catalog.
