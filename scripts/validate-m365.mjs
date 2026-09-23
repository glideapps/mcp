#!/usr/bin/env node

// Offline checks for the Microsoft 365 Copilot app package in microsoft-365/.
// Mirrors the limits in the Microsoft 365 app manifest schema (v1.29), the
// declarative agent schema (v1.8), the plugin manifest schema (v2.4), and the
// Agent Store validation guidelines, plus the cross-file consistency a reviewer
// checks by hand. Run `node scripts/validate-m365.mjs --zip` to also build the
// app package zip Partner Center expects.

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const packageDir = path.join(repoRoot, "microsoft-365");
const zipName = "glide-microsoft-365.zip";
const errors = [];
const warnings = [];

const placeholderPattern = /REPLACE_WITH_[A-Z0-9_]+/g;
const guidPattern = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/;
const hexColorPattern = /^#[0-9a-fA-F]{6}$/;
const httpsPattern = /^https:\/\//i;
const urlInTextPattern = /https?:\/\/|www\./i;
const mcpServerUrl = "https://mcp.glideapps.dev/mcp";

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

async function readText(fileName) {
  try {
    return await fs.readFile(path.join(packageDir, fileName), "utf8");
  } catch {
    addError(`${fileName} is missing.`);
    return null;
  }
}

async function readJson(fileName) {
  const raw = await readText(fileName);
  if (raw === null) {
    return null;
  }
  try {
    return { raw, value: JSON.parse(raw) };
  } catch (error) {
    addError(`${fileName} contains invalid JSON: ${error.message}`);
    return null;
  }
}

async function readPngSize(fileName) {
  let bytes;
  try {
    bytes = await fs.readFile(path.join(packageDir, fileName));
  } catch {
    addError(`${fileName} is missing.`);
    return null;
  }
  const signature = "89504e470d0a1a0a";
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== signature) {
    addError(`${fileName} is not a PNG file.`);
    return null;
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function reportPlaceholders(fileName, content) {
  const found = new Set(content.match(placeholderPattern) ?? []);
  for (const placeholder of found) {
    addWarning(`${fileName}: placeholder ${placeholder} must be filled in before submission.`);
  }
}

function checkLength(fileName, label, value, max, { required = true } = {}) {
  if (typeof value !== "string" || value.trim().length === 0) {
    if (required) {
      addError(`${fileName}: ${label} is required and must be a non-empty string.`);
    }
    return;
  }
  if (value.length > max) {
    addError(`${fileName}: ${label} is ${value.length} characters; the maximum is ${max}.`);
  }
}

function checkNoUrls(fileName, label, value) {
  if (typeof value === "string" && urlInTextPattern.test(value)) {
    addError(`${fileName}: ${label} must not contain URLs (Agent Store validation guideline for descriptions).`);
  }
}

function checkStarters(fileName, starters, label) {
  if (!Array.isArray(starters)) {
    addError(`${fileName}: ${label} must be an array.`);
    return;
  }
  if (starters.length < 3) {
    addError(`${fileName}: ${label} needs at least three entries (Agent Store validation guideline).`);
  }
  if (starters.length > 12) {
    addError(`${fileName}: ${label} allows at most 12 entries.`);
  }
  const seen = new Set();
  starters.forEach((starter, index) => {
    const text = starter?.text;
    checkLength(fileName, `${label}[${index}].text`, text, 128);
    if (typeof text === "string" && seen.has(text)) {
      addError(`${fileName}: ${label}[${index}] duplicates another starter.`);
    }
    seen.add(text);
  });
}

function validateManifest(manifest) {
  const file = "manifest.json";
  const version = manifest.manifestVersion;
  if (typeof version !== "string") {
    addError(`${file}: manifestVersion is required.`);
  } else {
    const expectedSchema = `https://developer.microsoft.com/json-schemas/teams/v${version}/MicrosoftTeams.schema.json`;
    if (manifest.$schema !== expectedSchema) {
      addError(`${file}: $schema must be ${expectedSchema} to match manifestVersion ${version}.`);
    }
  }
  for (const key of ["version", "id", "developer", "name", "description", "icons", "accentColor"]) {
    if (manifest[key] === undefined) {
      addError(`${file}: "${key}" is required.`);
    }
  }
  if (!guidPattern.test(manifest.id ?? "")) {
    addError(`${file}: id must be a GUID.`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) {
    addError(`${file}: version must be MAJOR.MINOR.PATCH.`);
  }
  if (!hexColorPattern.test(manifest.accentColor ?? "")) {
    addError(`${file}: accentColor must be a six-digit hex color starting with #.`);
  }

  const developer = manifest.developer ?? {};
  checkLength(file, "developer.name", developer.name, 32);
  for (const key of ["websiteUrl", "privacyUrl", "termsOfUseUrl"]) {
    if (!httpsPattern.test(developer[key] ?? "")) {
      addError(`${file}: developer.${key} must be an https URL.`);
    }
  }

  // Partner Center rejects validDomains entries that look like URLs, and its
  // guidelines count a "www" prefix as one (ValidDomainsContainsUrl).
  for (const domain of manifest.validDomains ?? []) {
    if (/:\/\/|\/|:/.test(domain) || /^www\./i.test(domain) || !/^(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(domain)) {
      addError(`${file}: validDomains entry "${domain}" must be a bare domain, with no scheme, path, port, or www prefix.`);
    }
  }

  checkLength(file, "name.short", manifest.name?.short, 30);
  checkLength(file, "name.full", manifest.name?.full, 100, { required: false });
  checkLength(file, "description.short", manifest.description?.short, 80);
  checkLength(file, "description.full", manifest.description?.full, 4000);
  checkNoUrls(file, "description.short", manifest.description?.short);
  checkNoUrls(file, "description.full", manifest.description?.full);

  if (manifest.icons?.color !== "color.png" || manifest.icons?.outline !== "outline.png") {
    addError(`${file}: icons.color must be "color.png" and icons.outline must be "outline.png".`);
  }

  const agents = manifest.copilotAgents?.declarativeAgents;
  if (!Array.isArray(agents) || agents.length !== 1) {
    addError(`${file}: copilotAgents.declarativeAgents must contain exactly one entry.`);
  } else if (agents[0].file !== "declarativeAgent.json" || !agents[0].id) {
    addError(`${file}: the declarative agent reference must have an id and point at declarativeAgent.json.`);
  }

  const connectors = manifest.agentConnectors;
  if (!Array.isArray(connectors) || connectors.length === 0) {
    addError(`${file}: agentConnectors must contain at least one connector.`);
    return;
  }
  if (connectors.length > 10) {
    addError(`${file}: agentConnectors allows at most 10 connectors.`);
  }
  const ids = new Set();
  connectors.forEach((connector, index) => {
    const label = `agentConnectors[${index}]`;
    checkLength(file, `${label}.id`, connector.id, 64);
    checkLength(file, `${label}.displayName`, connector.displayName, 128);
    checkLength(file, `${label}.description`, connector.description, 4000, { required: false });
    checkNoUrls(file, `${label}.description`, connector.description);
    if (ids.has(connector.id)) {
      addError(`${file}: ${label}.id "${connector.id}" is not unique.`);
    }
    ids.add(connector.id);
    const server = connector.toolSource?.remoteMcpServer;
    if (!server) {
      addError(`${file}: ${label}.toolSource.remoteMcpServer is required for an MCP connector.`);
      return;
    }
    if (server.mcpServerUrl !== mcpServerUrl) {
      addError(`${file}: ${label} mcpServerUrl must be ${mcpServerUrl}.`);
    }
    if (server.mcpToolDescription !== undefined) {
      addError(`${file}: ${label} declares mcpToolDescription, which disables dynamic tool discovery. Remove it, or pin the tools on purpose and update SUBMISSION.md.`);
    } else if (typeof version === "string" && Number(version) < 1.29) {
      addError(`${file}: dynamic tool discovery for agent connectors needs manifestVersion 1.29 or later (v1.27 and v1.28 make mcpToolDescription required).`);
    }
    const auth = server.authorization;
    const allowed = ["None", "OAuthPluginVault", "ApiKeyPluginVault", "DynamicClientRegistration", "AzureKeyVault"];
    if (!auth || !allowed.includes(auth.type)) {
      addError(`${file}: ${label} authorization.type must be one of ${allowed.join(", ")}.`);
    } else if (auth.type === "None") {
      addError(`${file}: ${label} authorization.type "None" is wrong for this server; it requires OAuth.`);
    } else if (auth.type !== "None" && !auth.referenceId) {
      addError(`${file}: ${label} authorization.referenceId is required for type ${auth.type}.`);
    }
  });
}

function validateDeclarativeAgent(agent) {
  const file = "declarativeAgent.json";
  if (agent.version !== "v1.8") {
    addError(`${file}: version must be "v1.8".`);
  }
  checkLength(file, "name", agent.name, 100);
  checkLength(file, "description", agent.description, 1000);
  checkLength(file, "instructions", agent.instructions, 8000);
  checkNoUrls(file, "description", agent.description);
  checkStarters(file, agent.conversation_starters, "conversation_starters");
  if (!Array.isArray(agent.actions) || agent.actions.length < 1 || agent.actions.length > 10) {
    addError(`${file}: actions must contain between 1 and 10 entries.`);
  } else if (!agent.actions.some((action) => action.file === "ai-plugin.json" && action.id)) {
    addError(`${file}: actions must reference ai-plugin.json with an id.`);
  }
}

function validatePlugin(plugin) {
  const file = "ai-plugin.json";
  if (plugin.schema_version !== "v2.4") {
    addError(`${file}: schema_version must be "v2.4".`);
  }
  checkLength(file, "name_for_human", plugin.name_for_human, 20);
  if (!/^[A-Za-z0-9]+$/.test(plugin.namespace ?? "")) {
    addError(`${file}: namespace must match ^[A-Za-z0-9]+$.`);
  }
  checkLength(file, "description_for_human", plugin.description_for_human, 100);
  checkLength(file, "description_for_model", plugin.description_for_model, 2048, { required: false });
  checkNoUrls(file, "description_for_human", plugin.description_for_human);
  checkNoUrls(file, "description_for_model", plugin.description_for_model);
  for (const key of ["legal_info_url", "privacy_policy_url"]) {
    if (!httpsPattern.test(plugin[key] ?? "")) {
      addError(`${file}: ${key} must be an https URL.`);
    }
  }
  if (!Array.isArray(plugin.functions) || plugin.functions.length !== 0) {
    addError(`${file}: functions must be an empty array for dynamic tool discovery.`);
  }
  const runtimes = plugin.runtimes;
  if (!Array.isArray(runtimes) || runtimes.length !== 1) {
    addError(`${file}: runtimes must contain exactly one runtime.`);
    return;
  }
  const runtime = runtimes[0];
  if (runtime.type !== "RemoteMCPServer") {
    addError(`${file}: runtimes[0].type must be "RemoteMCPServer".`);
  }
  if (runtime.spec?.url !== mcpServerUrl) {
    addError(`${file}: runtimes[0].spec.url must be ${mcpServerUrl}.`);
  }
  if (runtime.spec?.mcp_tool_description !== undefined) {
    addError(`${file}: runtimes[0].spec.mcp_tool_description pins the tools and disables dynamic tool discovery. Remove it, or pin on purpose and update SUBMISSION.md.`);
  }
  if (JSON.stringify(runtime.run_for_functions) !== JSON.stringify(["*"])) {
    addError(`${file}: runtimes[0].run_for_functions must be ["*"] for dynamic tool discovery.`);
  }
  const auth = runtime.auth;
  if (!auth || !["OAuthPluginVault", "None"].includes(auth.type)) {
    addError(`${file}: runtimes[0].auth.type must be "OAuthPluginVault" (used for both static OAuth and dynamic client registration).`);
  } else if (auth.type === "None") {
    addError(`${file}: runtimes[0].auth.type "None" is wrong for this server; it requires OAuth.`);
  } else if (!auth.reference_id) {
    addError(`${file}: runtimes[0].auth.reference_id is required.`);
  }
  if (plugin.capabilities?.conversation_starters) {
    checkStarters(file, plugin.capabilities.conversation_starters, "capabilities.conversation_starters");
  }
}

function validateCrossFile(manifest, agent, plugin) {
  const names = new Set([manifest.name?.short, agent.name, plugin.name_for_human]);
  if (names.size !== 1) {
    addError(`The agent name must be identical in manifest.json name.short, declarativeAgent.json name, and ai-plugin.json name_for_human (Agent Store validation guideline). Found: ${[...names].join(" / ")}.`);
  }
  const connectorAuth = manifest.agentConnectors?.[0]?.toolSource?.remoteMcpServer?.authorization?.referenceId;
  const pluginAuth = plugin.runtimes?.[0]?.auth?.reference_id;
  if (connectorAuth && pluginAuth && connectorAuth !== pluginAuth) {
    addWarning("manifest.json and ai-plugin.json reference different auth configs. That is allowed, but confirm both point at a live entry in the Microsoft Enterprise token store.");
  }
}

async function validateIcons() {
  const color = await readPngSize("color.png");
  if (color && (color.width !== 192 || color.height !== 192)) {
    addError(`color.png must be 192x192 pixels; found ${color.width}x${color.height}.`);
  }
  const outline = await readPngSize("outline.png");
  if (outline && (outline.width !== 32 || outline.height !== 32)) {
    addError(`outline.png must be 32x32 pixels; found ${outline.width}x${outline.height}.`);
  }
}

function buildZip() {
  const files = ["manifest.json", "declarativeAgent.json", "ai-plugin.json", "color.png", "outline.png"];
  const target = path.join(packageDir, zipName);
  const result = spawnSync("zip", ["-j", "-q", "-X", target, ...files.map((f) => path.join(packageDir, f))], { stdio: "inherit" });
  if (result.error || result.status !== 0) {
    addError(`Could not build ${zipName}; is the zip command installed?`);
    return;
  }
  console.log(`Built ${path.relative(repoRoot, target)} (files at the zip root, as Partner Center requires).`);
}

async function main() {
  const manifest = await readJson("manifest.json");
  const agent = await readJson("declarativeAgent.json");
  const plugin = await readJson("ai-plugin.json");
  await validateIcons();

  if (manifest) {
    reportPlaceholders("manifest.json", manifest.raw);
    validateManifest(manifest.value);
  }
  if (agent) {
    reportPlaceholders("declarativeAgent.json", agent.raw);
    validateDeclarativeAgent(agent.value);
  }
  if (plugin) {
    reportPlaceholders("ai-plugin.json", plugin.raw);
    validatePlugin(plugin.value);
  }
  if (manifest && agent && plugin) {
    validateCrossFile(manifest.value, agent.value, plugin.value);
  }

  for (const warning of warnings) {
    console.warn(`warning: ${warning}`);
  }
  for (const error of errors) {
    console.error(`error: ${error}`);
  }
  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
    process.exit(1);
  }
  if (process.argv.includes("--zip")) {
    buildZip();
    if (errors.length > 0) {
      process.exit(1);
    }
  }
  console.log(`microsoft-365/ package is structurally valid (${warnings.length} warning(s)).`);
}

await main();
