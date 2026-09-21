# Testing instructions for Microsoft validation

Paste this into the certification notes for the offer, with the credentials filled in.

---

## What Glide is

Glide connects Microsoft 365 Copilot to a GlideOS workspace, where teams build and run internal business apps. The agent registers Glide's Model Context Protocol (MCP) server as an agent connector, so Copilot can create and manage projects, query and modify app databases, run workflows, publish apps, and read and write project files, all on behalf of the signed-in Glide user.

Tools are discovered from the server at runtime, so the tool list reflects whatever the server currently offers rather than a list frozen at submission.

## Prerequisites

- A Glide account on a plan that includes the MCP server feature. Credentials are below. **An account without that feature can sign in, but every tool call is refused**, which looks like a broken agent rather than a licensing boundary.
- No tenant-side setup, admin consent, or configuration is required beyond installing the agent.

## Test credentials

| | |
| --- | --- |
| Glide sign-in URL | https://go.glideapps.com |
| Email | REPLACE_WITH_REVIEWER_EMAIL |
| Password | REPLACE_WITH_REVIEWER_PASSWORD |
| Organization | REPLACE_WITH_ORG_NAME |

The account is an organization admin, so every tool is reachable. It is a dedicated sandbox: the data is invented and nothing in it is customer data.

## Signing in

1. Open Microsoft 365 Copilot and select the **Glide** agent.
2. Ask any question about Glide data, for example the first prompt below.
3. Copilot shows a **Sign in** card. Select it, sign in with the credentials above, and approve access.
4. The popup closes. **Ask the question again in the same chat, or start a new chat.** Copilot resolves the tool list when a chat begins, so a conversation that started before sign-in may still report no tools. This is expected.

A brief connecting state at the start of each new chat is also expected. That is the agent resolving its tools from the server for that session.

## What to test

The agent ships five conversation starters. Each returns real data in the test organization.

| Prompt | Expected result |
| --- | --- |
| List my Glide projects and tell me which ones have a published app. | One project, **Equipment Checkout**, containing a published app of the same name and an enabled workflow called **Overdue Sweep**. The agent distinguishes apps from headless workflows. |
| Show me the tables in the database of my most recently created project. | Three tables (`equipment`, `checkouts`, `overdue_reminders`) and two views (`equipment_availability`, `checkout_activity`), each with a description read live from the database. |
| Which workflows are enabled in my most recently created project, and when did they last run? | **Overdue Sweep**, enabled, with its most recent run and a weekday schedule. |
| Are there any runtime errors in the current previews of my apps? | A clear report, whether or not errors exist. |
| Create a new Glide project called Inventory Tracker. | The agent describes the change and asks for confirmation before acting. See the next section. |

The published app behind this data can be opened directly to compare: **Equipment Checkout**, reachable from the project, shows the same equipment, checkouts, and statuses the agent reports.

## Disclosure and confirmation for actions

The agent never changes data without saying what will change and getting explicit approval first.

- Ask it to create a project, and it names the proposed change and waits for a confirming reply. Nothing is created until you confirm.
- The server itself independently refuses high-impact tools until a human approves that specific call: running shell scripts, running backend code, destructive SQL, database restores, deleting projects, and changing who can open an app. The agent cannot self-approve these.
- Most tools that change data accept a dry run and return a plan instead of executing.

**Safe to exercise destructively.** The organization is a sandbox. Create, rename, and delete projects freely; write to the database; run the workflow. Deleting the **Equipment Checkout** project would remove the data the prompts above rely on, so please delete only projects you created.

## Data handling

- Every call runs as the signed-in Glide user, inside their organization, subject to their role. The agent cannot reach another organization.
- Secret values are never returned. Listing secrets returns names and descriptions only.
- Every mutating call and every denied call is recorded in an audit log, queryable through the agent.
- File changes are recoverable, and database restores preserve the prior state first.

## Support

support@glideapps.com
