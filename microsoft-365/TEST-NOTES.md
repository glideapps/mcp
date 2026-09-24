# Testing instructions for Microsoft validation

Paste this into the certification notes for the offer, with the credentials filled in.

---

## What Glide is

Glide connects Microsoft 365 Copilot to a GlideOS workspace, where teams build and run internal business apps. The agent registers Glide's Model Context Protocol (MCP) server as an agent connector, so Copilot can create and manage projects, query and modify app databases, run workflows, publish apps, and read and write project files, all on behalf of the signed-in Glide user.

Tools are discovered from the server at runtime. Every tool the server offers has been exercised against the test organization described below.

## Test credentials

| Item | Value |
| --- | --- |
| Sign in at | https://go.glideapps.com |
| Method | **Sign in with Google.** Choose the Google option; there is no email and password form. |
| Google account | REPLACE_WITH_REVIEWER_EMAIL |
| Password | REPLACE_WITH_REVIEWER_PASSWORD |

The reviewer accounts you sent us have also been invited to the organization and can be used instead.

The account is an administrator of one Glide organization, so every tool is reachable. The organization is a sandbox: its data is invented and nothing in it is customer data. No tenant-side setup or admin consent is needed beyond installing the agent.

## Signing in

1. Open Microsoft 365 Copilot and select the **Glide** agent.
2. Ask any conversation starter.
3. Copilot shows a **Sign in** card. Select it, choose **Sign in with Google**, use the account above, and approve access.
4. The popup closes. **Ask again in the same chat, or start a new chat.** Copilot loads the tool list when a chat begins, so a chat that started before sign-in may still report no tools.

## The two projects to use

| Project | Use it for | Contents |
| --- | --- | --- |
| **Equipment Checkout** | Read-only questions. Please don't delete or restore it; the starters depend on it. | Published app **Equipment Checkout**. Workflows **Overdue Sweep** (weekdays 9:00 Pacific) and **Delivery Follow-up** (started by a Gmail trigger, an app trigger, and a data trigger). Tables `equipment`, `checkouts`, `equipment_intake`, `overdue_reminders`; views `equipment_availability`, `checkout_activity`. Files include `attachments/new-equipment.csv` and `attachments/equipment-budget.xlsm`. |
| **Sandbox** | Anything that changes or removes things. Safe to change, restore, or delete. | App **Sandbox App**, workflow **tick** with a schedule, webhook, app trigger, and data trigger. Table `sandbox_notes`, file `notes/readme.md`, database backups. |

Other projects in the organization were created by earlier reviewers and can be ignored.

## Conversation starters

| Prompt | Expected result |
| --- | --- |
| List my Glide projects and tell me which ones have a published app. | Every project, with **Equipment Checkout** having a published app. Workflows are reported as workflows, not unpublished apps. |
| Which of my Glide projects have a database, and what tables are in them? | Equipment Checkout's four tables and two views, plus the Sandbox's `sandbox_notes`. |
| Which workflows are enabled across my Glide projects, and when did they last run? | Overdue Sweep and Delivery Follow-up in Equipment Checkout, and tick in the Sandbox, each with its last run. |
| Are there any runtime errors in the current previews of my apps? | A clear report, whether or not errors exist. |
| Create a new Glide project called Inventory Tracker. | The agent describes the change and waits for your confirmation before creating it. |

## Prompts for every tool area

Each prompt is phrased the way a user would ask. The tools it exercises are in brackets.

**Projects and account**

- "Find my Equipment Checkout project and show its details." [project_search, project_lookup, project_get, project_list]
- "Rename the Sandbox project to Sandbox Test, and set its accent color to #16a34a." [project_rename, project_set_accent_color]
- "Delete the project called Inventory Tracker that I just created." [project_delete]
- "Who am I signed in as, what's my role, and what's my plan?" [auth_whoami, org_member_role_lookup, billing_lookup, auth_list_actions, auth_check]
- "Which AI models can my apps use, and what's the org's model policy?" [ai_models_list, org_model_policy_lookup]

**Apps**

- "Show the Equipment Checkout app, its versions, and its production URL." [app_list, app_get, app_list_versions]
- "In the Sandbox, rename Sandbox App to Sandbox Demo, change its icon, and give me a sign-in link to it." [app_set_name, app_set_icon, app_authenticated_link]
- "Publish the latest Sandbox App preview, then roll it back to the previous version." [app_publish, app_promote, app_rollback]
- "Make the Sandbox App open to anyone in my organization." [app_set_access]
- "Claim the vanity address sandbox-demo for the Sandbox App, then release it." [app_claim_vanity_slug, app_release_vanity_slug]
- "What's the custom domain status of the Sandbox App?" [app_custom_domain_status]
- "Add a heading component to the Sandbox App and update its preview." [ui_add_glide_components, update_preview, add_app_assets]
- "Delete the Sandbox App." [app_delete]
- "Suggest an App Store template for tracking assets, and install it." [suggest_apps, use_app_store_app] (creates a new project)

**Data**

- "How many items in Equipment Checkout are checked out right now?" [db_select, db_list_tables, db_list, db_get, db_health, db_compute]
- "Add a note saying 'hello' to the Sandbox's sandbox_notes table." [db_execute]
- "Load attachments/new-equipment.csv from Equipment Checkout into a table." [db_ingest_data_source]
- "Show the Sandbox database backups, create one now, and restore the Sandbox to 10 minutes ago." [db_backup_status, db_backup_list, db_backup_create, db_backup_connection, db_restore_to_point, db_restore_from_backup, db_backup_delete]

**Files and spreadsheets**

- "List the files in Equipment Checkout and search them for 'overdue'." [file_list, file_search, file_read, file_stat, file_inspect, file_history]
- "In the Sandbox, copy notes/readme.md to notes/copy.md, edit it, move it, delete it, then restore it." [file_write, file_edit, file_copy, file_move, file_delete, file_restore, workspace_restore]
- "What's in attachments/equipment-budget.xlsm in Equipment Checkout? Show the table, the pivot, the comment on D7, and the macro." [spreadsheet_list_features, spreadsheet_inspect_range, spreadsheet_grep, spreadsheet_read_table_definition, spreadsheet_read_pivot_definition, spreadsheet_read_cell_comment, spreadsheet_list_macros, spreadsheet_read_macro_source, spreadsheet_extract_assets]

**Workflows**

- "Show the runs of Delivery Follow-up and what each step returned." [list_workflow_apps, list_workflow_runs, get_workflow_run, get_workflow_step_output]
- "Run the tick workflow in the Sandbox and wait for it to finish." [run_workflow, wait_for_workflow_run, cancel_workflow_run]
- "List the schedules, webhooks, app triggers, and data triggers in Equipment Checkout." [list_workflow_schedules, list_workflow_webhooks, list_workflow_app_triggers, list_workflow_data_triggers]
- "In the Sandbox, change tick's schedule to 10:00 on Mondays, then pause it and delete it." [update_workflow_schedule, set_workflow_schedule_enabled, remove_workflow_schedule, create_workflow_schedule]
- "In the Sandbox, rotate tick's webhook, require a secret header, disable it, then delete it." [rotate_workflow_webhook, set_workflow_webhook_header_auth, set_workflow_webhook_enabled, delete_workflow_webhook, create_workflow_webhook]
- "In the Sandbox, turn off and then delete tick's app trigger and data trigger." [set_workflow_app_trigger_enabled, delete_workflow_app_trigger, update_workflow_data_trigger, set_workflow_data_trigger_enabled, delete_workflow_data_trigger, create_workflow_app_trigger, create_workflow_data_trigger]
- "Turn the tick workflow off, then back on." [set_workflow_enabled]

**Integrations**

- "Which Gmail triggers and actions are available, and what triggers does Equipment Checkout have?" [integration_search, integration_actions, list_triggers, list_active_triggers]
- "Pause the Gmail delivery notice trigger, then turn it back on." [set_trigger_enabled] (enable_trigger and delete_trigger work the same way)

**Diagnostics**

- "Show recent logs and AI usage for Equipment Checkout." [log_query, ai_query_usage, app_runtime_errors, log_clear]
- "Show the audit log of recent tool calls and trace the last one." [auth_audit_query, auth_audit_trace, resource_list]
- "Run a shell command in the Sandbox that counts its files." [bash] "Run backend code in the Sandbox that counts rows in sandbox_notes." [run_backend_code]
- "Send feedback to Glide that this works well." [send_feedback]

## Confirmation for actions

- The agent's instructions require it to describe any change and wait for explicit approval before calling a tool that changes or removes something.
- For shell scripts (bash) and backend code (run_backend_code), the server refuses the call until a human approves it. When you approve, the agent calls the tool again with your approval.
- Most tools that change data accept a dry run and return a plan instead of acting.

## Expected limitations in the test organization

- **Secrets:** the organization has no secrets, so listing secrets returns an empty list. Secret values are never returned in any case.
- **Custom domains:** binding a custom domain needs DNS records on a domain you own, so the status tool reports that no domain is bound.
- **Data triggers** are created and listed normally, but change capture is not enabled for this organization, so table changes do not start a run.

## Data handling

- Every call runs as the signed-in Glide user, inside their organization, subject to their role. The agent cannot reach another organization.
- Every change and every refused call is recorded in an audit log, which you can query through the agent.
- File changes can be restored, and database restores keep the prior state as a backup first.

## Support

support@glideapps.com
