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

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function loadConfig() {
  const configPath = path.resolve(argValue(
    "--config",
    process.env.RUST_SKILLS_BENCH_CONFIG || path.join(root, "bench.config.json")
  ));
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

const config = loadConfig();
const subjectRoot = path.resolve(argValue(
  "--subject-root",
  process.env.RUST_SKILLS_SUBJECT_ROOT || config.subjectRoot || path.resolve(root, "..", "rust-skills")
));

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
  return counts;
}

function hasExpectedSignal(testCase) {
  const expected = testCase.expected || {};
  return Boolean(
    expected.minResponseChars ||
    (expected.mustMention || []).length ||
    (expected.mustMentionAny || []).length ||
    (expected.mustNotMention || []).length ||
    (expected.files || []).length ||
    (expected.mustMentionInFiles || []).length ||
    (testCase.verifyCommands || []).length
  );
}

function auditCase(testCase, seenIds) {
  const failures = [];
  if (!testCase.id) failures.push({ kind: "missing_id" });
  if (seenIds.has(testCase.id)) failures.push({ kind: "duplicate_id", id: testCase.id });
  seenIds.add(testCase.id);

  if (!testCase.category) failures.push({ kind: "missing_category", id: testCase.id });
  if (!testCase.difficulty) failures.push({ kind: "missing_difficulty", id: testCase.id });
  if (!testCase.prompt || testCase.prompt.length < 40) {
    failures.push({ kind: "weak_prompt", id: testCase.id });
  }
  if (!Array.isArray(testCase.tags) || testCase.tags.length < 2) {
    failures.push({ kind: "missing_tags", id: testCase.id });
  }
  if (!hasExpectedSignal(testCase)) {
    failures.push({ kind: "missing_mechanical_expectation", id: testCase.id });
  }
  for (const group of testCase.expected?.mustMentionAny || []) {
    const phrases = Array.isArray(group) ? group : group.phrases;
    if (!Array.isArray(phrases) || phrases.length < 2) {
      failures.push({ kind: "weak_must_mention_any", id: testCase.id });
    }
  }

  const prompt = String(testCase.prompt || "").toLowerCase();
  const unfairPatterns = [
    /\brust-skills\b/,
    /\bbaseline\b/,
    /\bour product\b/,
    /\bthis repo\b/,
    /\bthis repository\b/,
    /\bbeat the other\b/,
    /\boutperform\b/,
    /\buse the provided skill\b/
  ];
  for (const pattern of unfairPatterns) {
    if (pattern.test(prompt)) failures.push({ kind: "unfair_prompt_signal", id: testCase.id, pattern: String(pattern) });
  }

  if (testCase.fixtureDir && !fs.existsSync(path.resolve(subjectRoot, testCase.fixtureDir))) {
    failures.push({ kind: "missing_fixture_dir", id: testCase.id, fixtureDir: testCase.fixtureDir });
  }
  if (testCase.fixtureDir) {
    const fixturePath = path.resolve(subjectRoot, testCase.fixtureDir);
    if (fs.existsSync(path.join(fixturePath, "target"))) {
      failures.push({ kind: "fixture_contains_build_artifacts", id: testCase.id, fixtureDir: testCase.fixtureDir });
    }
    const gitignorePath = path.join(fixturePath, ".gitignore");
    const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";
    if (testCase.category === "code-generation" && !gitignore.split(/\r?\n/).includes("/target/")) {
      failures.push({ kind: "fixture_target_not_ignored", id: testCase.id, fixtureDir: testCase.fixtureDir });
    }
  }
  if (testCase.category === "code-generation" && (testCase.verifyCommands || []).length === 0) {
    failures.push({ kind: "codegen_without_verify_command", id: testCase.id });
  }
  return failures;
}

const casesValue = argValue(
  "--cases",
  csvConfig(config.cases, path.join(root, "fixtures", "agent-matrix-comprehensive.json"))
);
const reportPath = path.resolve(argValue(
  "--report",
  path.join(root, config.resultsDir || "results", "agent-fixture-audit-report.json")
));
const { cases, casesPaths } = readCases(casesValue);
const seenIds = new Set();
const failures = cases.flatMap((testCase) => auditCase(testCase, seenIds));
const categories = countBy(cases, "category");
const difficulties = countBy(cases, "difficulty");
const tags = tagCounts(cases);

const requiredCategories = {
  "answer-quality": 6,
  "artifact-generation": 3,
  "code-generation": 4,
  "review-debugging": 2
};
for (const [category, minimum] of Object.entries(requiredCategories)) {
  if ((categories[category] || 0) < minimum) {
    failures.push({ kind: "category_undercovered", category, minimum, actual: categories[category] || 0 });
  }
}

for (const tag of [
  "ownership",
  "concurrency",
  "error-handling",
  "unsafe",
  "performance",
  "async",
  "web",
  "cli",
  "embedded",
  "no-std",
  "codegen"
]) {
  if (!tags[tag]) failures.push({ kind: "tag_missing", tag });
}

if (cases.length < 18) failures.push({ kind: "too_few_cases", minimum: 18, actual: cases.length });

const report = {
  status: failures.length === 0 ? "PASS" : "FAIL",
  generatedAt: new Date().toISOString(),
  subjectRoot,
  casesPath: casesPaths.length === 1 ? casesPaths[0] : casesPaths.join(","),
  casesPaths,
  summary: {
    total: cases.length,
    categories,
    difficulties,
    tags
  },
  fairness: {
    promptPolicy: "No prompt may mention rust-skills, baseline, this repository, or ask one profile to outperform another.",
    productNeutral: true
  },
  failures
};

writeJson(reportPath, report);
console.log(JSON.stringify({
  status: report.status,
  report: reportPath,
  summary: report.summary
}, null, 2));

if (failures.length > 0) {
  console.error(JSON.stringify({ status: "FAIL", failures }, null, 2));
  process.exit(1);
}
