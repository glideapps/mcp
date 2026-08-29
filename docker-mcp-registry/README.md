# Docker MCP Catalog submission

Staging copy of Glide's entry for the [Docker MCP Registry](https://github.com/docker/mcp-registry),
which feeds the [Docker MCP Catalog](https://hub.docker.com/mcp) and the MCP Toolkit in Docker
Desktop.

The files under [`servers/glide`](servers/glide) are the complete submission. Docker's registry does
not consume this directory — it is kept here so the entry is versioned alongside our other
ecosystem manifests and stays in sync when the endpoint, description, or docs URL change.

## What kind of entry this is

Glide is submitted as a **remote server**, not a containerized one. Our MCP server is already hosted
at `https://mcp.glideapps.dev/mcp`, so Docker does not build or publish an image for us, and no
Dockerfile is involved. Remote entries are three files:

| File | Contents |
| --- | --- |
| `server.yaml` | Server metadata, remote endpoint, and OAuth block |
| `tools.json` | Always `[]` — tools are discovered dynamically after sign-in |
| `readme.md` | A single `Docs:` line pointing at our MCP documentation |

`dynamic.tools: true` is required for any entry with an `oauth` block: the tool list can only be
read once a user has authenticated, so Docker discovers it at runtime instead of at review time.

The `oauth` block follows the registry's convention for OAuth 2.1 servers (the same shape Linear,
Notion, and Asana use). The `secret`/`env` names are placeholders the Toolkit fills in after the
browser sign-in flow — Glide does not use personal access tokens, and users are never asked for one.

## Submitting

1. **Docker Hub account.** A Docker Hub account is needed to open the PR and to test locally. An
   organization account is only required if we want Docker to build and host an image for us, which
   remote entries do not use.
2. **Fork and branch.**
   ```bash
   git clone https://github.com/<your-fork>/mcp-registry
   cd mcp-registry
   git checkout -b add-glide
   cp -r <this-repo>/docker-mcp-registry/servers/glide servers/glide
   ```
3. **Validate.** Requires Go 1.24+, [Task](https://taskfile.dev/), and Docker Desktop.
   ```bash
   task validate -- --name glide
   ```
4. **Test in the MCP Toolkit.** This is the step Docker's reviewers care most about.
   ```bash
   task catalog -- glide
   docker mcp catalog import $PWD/catalogs/glide/catalog.yaml
   docker mcp server enable glide
   docker mcp oauth authorize glide     # completes the Glide sign-in flow
   docker mcp gateway run               # then call a tool, e.g. list projects
   docker mcp catalog reset             # restore the stock catalog when done
   ```
   The account used for testing needs a [Glide plan](https://www.glideapps.com/pricing) that
   includes the MCP server feature.
5. **Open the PR** against `docker/mcp-registry`, filling in
   `.github/PULL_REQUEST_TEMPLATE.md`. Several checklist items in that template
   ("Docker Artifact: Dockerfile", "Repository URL") assume a containerized server — note that this
   is a remote entry and point them at https://github.com/glideapps/mcp.
6. **Share test credentials.** Docker reviews OAuth servers by hand and needs an account to test
   with: https://forms.gle/6Lw3nsvu2d6nFg8e6
7. **Review.** Every PR requires a Docker team review. Once merged, the entry appears on
   https://hub.docker.com/mcp and in Docker Desktop's MCP Toolkit within about 24 hours.

## Keeping the entry current

If `server.yaml` here changes, the change has to be PR'd to `docker/mcp-registry` separately —
Docker's nightly update automation only tracks `source.commit` on containerized servers, which
remote entries do not have.
