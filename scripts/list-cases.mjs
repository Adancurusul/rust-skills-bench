#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function csvConfig(value, fallback) {
  if (Array.isArray(value)) return value.join(",");
  return value || fallback;
}

function readCases(casesValue) {
  const paths = splitCsv(casesValue);
  if (paths.length === 0) throw new Error("--cases must not be empty");
  const cases = [];
  for (const casePath of paths) {
    const absolutePath = path.resolve(casePath);
    const loaded = readJson(absolutePath);
    const items = Array.isArray(loaded) ? loaded : loaded.cases;
    if (!Array.isArray(items)) throw new Error(`${absolutePath} must contain an array or { "cases": [] }`);
    for (const item of items) cases.push({ ...item, sourceCaseFile: absolutePath });
  }
  return { cases, casesPaths: paths.map((item) => path.resolve(item)) };
}

function loadConfig() {
  const configPath = path.resolve(argValue(
    "--config",
    process.env.RUST_SKILLS_BENCH_CONFIG || path.join(root, "bench.config.json")
  ));
  if (!fs.existsSync(configPath)) return {};
  return readJson(configPath);
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    const value = item[key] || "unspecified";
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function tagCounts(items) {
  const counts = {};
  for (const item of items) {
    for (const tag of item.tags || []) counts[tag] = (counts[tag] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function groupBy(items, key) {
  const groups = {};
  for (const item of items) {
    const value = item[key] || "unspecified";
    (groups[value] ||= []).push(item);
  }
  return groups;
}

function markdown(cases, casesPath) {
  const categories = groupBy(cases, "category");
  const lines = [
    "# Case Catalog",
    "",
    `Source: \`${Array.isArray(casesPath) ? casesPath.map((item) => path.relative(root, item)).join("`, `") : path.relative(root, casesPath)}\``,
    "",
    "## Summary",
    "",
    `- Total cases: ${cases.length}`,
    `- Categories: ${Object.entries(countBy(cases, "category")).map(([key, value]) => `${key}=${value}`).join(", ")}`,
    `- Difficulties: ${Object.entries(countBy(cases, "difficulty")).map(([key, value]) => `${key}=${value}`).join(", ")}`,
    "",
    "## Tags",
    "",
    "| Tag | Count |",
    "|-----|-------|"
  ];
  for (const [tag, count] of Object.entries(tagCounts(cases))) {
    lines.push(`| ${tag} | ${count} |`);
  }

  for (const [category, items] of Object.entries(categories)) {
    lines.push("", `## ${category}`, "", "| ID | Difficulty | Tags | Verification |", "|----|------------|------|--------------|");
    for (const item of items) {
      const verification = (item.verifyCommands || []).length
        ? item.verifyCommands.join("<br>")
        : "text/file expectations";
      lines.push(`| ${item.id} | ${item.difficulty || "unspecified"} | ${(item.tags || []).join(", ")} | ${verification} |`);
    }
  }

  return `${lines.join("\n")}\n`;
}

const config = loadConfig();
const casesValue = argValue(
  "--cases",
  csvConfig(config.cases, path.join(root, "fixtures", "agent-matrix-comprehensive.json"))
);
const { cases, casesPaths } = readCases(casesValue);
const outputPath = argValue("--out", null);
const format = argValue("--format", outputPath?.endsWith(".json") ? "json" : "markdown");

const output = format === "json"
  ? `${JSON.stringify({ casesPath: casesPaths.length === 1 ? casesPaths[0] : casesPaths.join(","), casesPaths, summary: { total: cases.length, categories: countBy(cases, "category"), difficulties: countBy(cases, "difficulty"), tags: tagCounts(cases) }, cases }, null, 2)}\n`
  : markdown(cases, casesPaths.length === 1 ? casesPaths[0] : casesPaths);

if (outputPath) {
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, output);
} else {
  process.stdout.write(output);
}

if (hasFlag("--check")) {
  if (!cases.length) throw new Error("case catalog is empty");
}
