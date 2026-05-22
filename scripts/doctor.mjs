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

function commandExists(command) {
  const pathEntries = String(process.env.PATH || "").split(path.delimiter).filter(Boolean);
  const extensions = process.platform === "win32" ? [".cmd", ".exe", ".bat", ""] : [""];
  return pathEntries.some((entry) =>
    extensions.some((extension) => fs.existsSync(path.join(entry, `${command}${extension}`)))
  );
}

function builtinCommand(engine) {
  if (engine === "codex") return "codex";
  if (engine === "claude-code") return "claude";
  return null;
}

const config = loadConfig();
const subjectRoot = path.resolve(argValue(
  "--subject-root",
  process.env.RUST_SKILLS_SUBJECT_ROOT || config.subjectRoot || path.resolve(root, "..", "rust-skills")
));
const engines = splitCsv(argValue("--engines", csvConfig(config.engines, "codex,claude-code")));
const engineAdapters = config.engineAdapters || {};
const checks = [];

checks.push({
  name: "node",
  status: "PASS",
  detail: process.version
});
checks.push({
  name: "subject-root",
  status: fs.existsSync(path.join(subjectRoot, "lib", "routing.js")) ? "PASS" : "FAIL",
  detail: subjectRoot
});
checks.push({
  name: "case-fixture",
  status: fs.existsSync(path.join(root, "fixtures", "agent-matrix-comprehensive.json")) ? "PASS" : "FAIL",
  detail: "fixtures/agent-matrix-comprehensive.json"
});
checks.push({
  name: "expanded-fixture",
  status: fs.existsSync(path.join(root, "fixtures", "prompt-suites", "rust-skills-expanded.json")) ? "PASS" : "FAIL",
  detail: "fixtures/prompt-suites/rust-skills-expanded.json"
});

for (const engine of engines) {
  const command = builtinCommand(engine) || engineAdapters[engine]?.command;
  checks.push({
    name: `engine:${engine}`,
    status: command && commandExists(command) ? "PASS" : "WARN",
    detail: command || "no built-in command or engineAdapters entry"
  });
}

const status = checks.some((check) => check.status === "FAIL") ? "FAIL" : "PASS";
const report = {
  status,
  generatedAt: new Date().toISOString(),
  subjectRoot,
  engines,
  checks
};

console.log(JSON.stringify(report, null, 2));
if (status === "FAIL") process.exit(1);
