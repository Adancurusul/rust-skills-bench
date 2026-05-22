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
    `Source: \`${path.relative(root, casesPath)}\``,
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
const casesPath = path.resolve(argValue(
  "--cases",
  config.cases || path.join(root, "fixtures", "agent-matrix-comprehensive.json")
));
const cases = readJson(casesPath);
const outputPath = argValue("--out", null);
const format = argValue("--format", outputPath?.endsWith(".json") ? "json" : "markdown");

const output = format === "json"
  ? `${JSON.stringify({ casesPath, summary: { total: cases.length, categories: countBy(cases, "category"), difficulties: countBy(cases, "difficulty"), tags: tagCounts(cases) }, cases }, null, 2)}\n`
  : markdown(cases, casesPath);

if (outputPath) {
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, output);
} else {
  process.stdout.write(output);
}

if (hasFlag("--check")) {
  if (!cases.length) throw new Error("case catalog is empty");
}
