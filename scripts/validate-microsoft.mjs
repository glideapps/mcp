#!/usr/bin/env node

// Offline checks for the Microsoft Copilot connector package in microsoft/.
// Mirrors what Partner Center's automated validation rejects, plus the
// cross-file consistency a reviewer would catch by hand.

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const packageDir = path.join(repoRoot, "microsoft");
const errors = [];
const warnings = [];

const placeholderPattern = /REPLACE_WITH_[A-Z0-9_]+/g;
const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

async function readText(fileName) {
  const filePath = path.join(packageDir, fileName);
  try {
    return await fs.readFile(filePath, "utf8");
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

function reportPlaceholders(fileName, content) {
  const found = new Set(content.match(placeholderPattern) ?? []);
  for (const placeholder of found) {
    addWarning(`${fileName}: placeholder ${placeholder} must be filled in before submission.`);
  }
}

function validateSwagger(swagger) {
  if (swagger.swagger !== "2.0") {
    addError('apiDefinition.swagger.json: "swagger" must be "2.0" (Power Platform connectors are OpenAPI 2.0).');
  }

  for (const field of ["title", "description", "version"]) {
    if (typeof swagger.info?.[field] !== "string" || swagger.info[field].length === 0) {
      addError(`apiDefinition.swagger.json: "info.${field}" is required.`);
    }
  }

  if (typeof swagger.host !== "string" || swagger.host.includes("/") || swagger.host.includes(":")) {
    addError('apiDefinition.swagger.json: "host" must be a bare hostname with no scheme, port, or path.');
  }

  if (!Array.isArray(swagger.schemes) || swagger.schemes.length !== 1 || swagger.schemes[0] !== "https") {
    addError('apiDefinition.swagger.json: "schemes" must be exactly ["https"].');
  }

  const operations = [];
  for (const [routePath, methods] of Object.entries(swagger.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods ?? {})) {
      operations.push({ routePath, method, operation });
    }
  }

  if (operations.length === 0) {
    addError('apiDefinition.swagger.json: "paths" must define at least one operation.');
  }

  const mcpOperations = operations.filter(
    ({ operation }) => operation["x-ms-agentic-protocol"] === "mcp-streamable-1.0"
  );
  if (mcpOperations.length !== 1) {
    addError(
      'apiDefinition.swagger.json: exactly one operation must carry "x-ms-agentic-protocol": "mcp-streamable-1.0".'
    );
  }

  for (const { routePath, method, operation } of operations) {
    const label = `${method.toUpperCase()} ${routePath}`;
    if (method !== "post") {
      addError(`apiDefinition.swagger.json: ${label} — the MCP operation must be a POST.`);
    }
    if (typeof operation.operationId !== "string" || operation.operationId.length === 0) {
      addError(`apiDefinition.swagger.json: ${label} is missing "operationId".`);
    }
    if (typeof operation.summary !== "string" || operation.summary.length === 0) {
      addError(`apiDefinition.swagger.json: ${label} is missing "summary".`);
    }
    if (!operation.responses?.["200"]) {
      addError(`apiDefinition.swagger.json: ${label} must declare a 200 response.`);
    }
  }

  const securityDefinitions = swagger.securityDefinitions ?? {};
  const oauthNames = Object.entries(securityDefinitions)
    .filter(([, definition]) => definition.type === "oauth2")
    .map(([name]) => name);

  if (oauthNames.length !== 1) {
    addError('apiDefinition.swagger.json: exactly one "securityDefinitions" entry of type "oauth2" is expected.');
    return null;
  }

  const [oauthName] = oauthNames;
  const oauth = securityDefinitions[oauthName];
  if (oauth.flow !== "accessCode") {
    addError(`apiDefinition.swagger.json: securityDefinitions.${oauthName}.flow must be "accessCode".`);
  }
  for (const field of ["authorizationUrl", "tokenUrl"]) {
    if (typeof oauth[field] !== "string" || oauth[field].length === 0) {
      addError(`apiDefinition.swagger.json: securityDefinitions.${oauthName}.${field} is required.`);
    }
  }
  const scopes = Object.keys(oauth.scopes ?? {});
  if (scopes.length === 0) {
    addError(`apiDefinition.swagger.json: securityDefinitions.${oauthName}.scopes must list at least one scope.`);
  }

  const applied = (swagger.security ?? []).flatMap((entry) => entry[oauthName] ?? []);
  if (applied.length === 0) {
    addError(`apiDefinition.swagger.json: "security" must apply ${oauthName} to the API.`);
  }
  for (const scope of applied) {
    if (!scopes.includes(scope)) {
      addError(`apiDefinition.swagger.json: "security" references scope "${scope}" that is not declared.`);
    }
  }

  const metadata = new Map(
    (swagger["x-ms-connector-metadata"] ?? []).map((entry) => [entry.propertyName, entry.propertyValue])
  );
  for (const required of ["Website", "Privacy policy", "Categories"]) {
    if (!metadata.has(required)) {
      addError(`apiDefinition.swagger.json: "x-ms-connector-metadata" is missing "${required}".`);
    }
  }

  return { authorizationUrl: oauth.authorizationUrl, tokenUrl: oauth.tokenUrl, scopes: applied };
}

function validateProperties(properties, swaggerOauth) {
  const props = properties.properties;
  if (!props || typeof props !== "object") {
    addError('apiProperties.json: top-level "properties" object is required.');
    return;
  }

  for (const field of ["publisher", "stackOwner"]) {
    if (typeof props[field] !== "string" || props[field].length === 0) {
      addError(`apiProperties.json: "${field}" is required for certified connectors.`);
    }
  }

  if (typeof props.iconBrandColor !== "string" || !hexColorPattern.test(props.iconBrandColor)) {
    addError('apiProperties.json: "iconBrandColor" must be a 6-digit hex color like "#000000".');
  }

  const oauthParams = Object.entries(props.connectionParameters ?? {}).filter(
    ([, parameter]) => parameter.type === "oauthSetting"
  );
  if (oauthParams.length !== 1) {
    addError('apiProperties.json: exactly one connection parameter of type "oauthSetting" is expected.');
    return;
  }

  const [name, parameter] = oauthParams[0];
  const settings = parameter.oAuthSettings ?? {};
  const label = `apiProperties.json: connectionParameters.${name}.oAuthSettings`;

  if (settings.identityProvider !== "oauth2" && settings.identityProvider !== "oauth2generic") {
    addError(`${label}.identityProvider must be "oauth2" or "oauth2generic".`);
  }
  if (typeof settings.clientId !== "string" || settings.clientId.length === 0) {
    addError(`${label}.clientId is required.`);
  }
  if (settings.redirectMode !== "Global") {
    addError(`${label}.redirectMode must be "Global".`);
  }
  if (
    typeof settings.redirectUrl !== "string" ||
    !settings.redirectUrl.startsWith("https://global.consent.azure-apim.net/redirect")
  ) {
    addError(`${label}.redirectUrl must start with "https://global.consent.azure-apim.net/redirect".`);
  }
  if (/client[_-]?secret/i.test(JSON.stringify(settings)) && settings.clientSecret) {
    addError(`${label} must not contain a client secret — upload it in Partner Center instead.`);
  }

  const custom = settings.customParameters ?? {};
  for (const field of ["authorizationUrl", "tokenUrl", "refreshUrl"]) {
    if (typeof custom[field]?.value !== "string" || custom[field].value.length === 0) {
      addError(`${label}.customParameters.${field}.value is required.`);
    }
  }

  if (!swaggerOauth) {
    return;
  }

  if (custom.authorizationUrl?.value !== swaggerOauth.authorizationUrl) {
    addError("authorizationUrl differs between apiDefinition.swagger.json and apiProperties.json.");
  }
  if (custom.tokenUrl?.value !== swaggerOauth.tokenUrl) {
    addError("tokenUrl differs between apiDefinition.swagger.json and apiProperties.json.");
  }

  const propertyScopes = Array.isArray(settings.scopes) ? settings.scopes : [];
  const sortedA = [...propertyScopes].sort().join(" ");
  const sortedB = [...swaggerOauth.scopes].sort().join(" ");
  if (sortedA !== sortedB) {
    addError("OAuth scopes differ between apiDefinition.swagger.json and apiProperties.json.");
  }
}

async function validateIcon() {
  const iconPath = path.join(packageDir, "icon.png");
  let bytes;
  try {
    bytes = await fs.readFile(iconPath);
  } catch {
    addError("icon.png is missing.");
    return;
  }

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(pngSignature)) {
    addError("icon.png is not a PNG file.");
    return;
  }

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== height) {
    addError(`icon.png must be square (found ${width}×${height}).`);
  }
  if (width < 100 || width > 1024) {
    addWarning(`icon.png is ${width}×${height}; certified connectors typically ship 144–800 px.`);
  }
}

async function validateIntro() {
  const content = await readText("intro.md");
  if (content === null) {
    return;
  }

  reportPlaceholders("intro.md", content);

  const headings = new Set(
    content
      .split("\n")
      .filter((line) => line.startsWith("## "))
      .map((line) => line.slice(3).trim().toLowerCase())
  );

  const required = [
    "prerequisites",
    "supported operations",
    "obtaining credentials",
    "getting started",
    "known issues and limitations",
  ];
  for (const heading of required) {
    if (!headings.has(heading)) {
      addError(`intro.md is missing the "## ${heading}" section.`);
    }
  }

  if (!/^## Publisher: .+/m.test(content)) {
    addError('intro.md must name the publisher with a "## Publisher: <name>" heading.');
  }
}

async function main() {
  const swaggerFile = await readJson("apiDefinition.swagger.json");
  const propertiesFile = await readJson("apiProperties.json");

  let swaggerOauth = null;
  if (swaggerFile) {
    reportPlaceholders("apiDefinition.swagger.json", swaggerFile.raw);
    swaggerOauth = validateSwagger(swaggerFile.value);
  }
  if (propertiesFile) {
    reportPlaceholders("apiProperties.json", propertiesFile.raw);
    validateProperties(propertiesFile.value, swaggerOauth);
  }

  await validateIcon();
  await validateIntro();

  summarizeAndExit();
}

function summarizeAndExit() {
  if (warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
    console.log("");
  }

  if (errors.length > 0) {
    console.error("Validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Validation passed.");
}

await main();
