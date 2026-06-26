#!/usr/bin/env node
/**
 * Compare two bench report.json files.
 * Usage:
 *   node scripts/compare-reports.mjs --a results/.../report.json --b results/.../report.json [--out delta.md]
 *
 * Typical workflow (main vs feature):
 *   RUST_SKILLS_SUBJECT_ROOT=../rust-skills-main  npm run agents:quick-real -- --run-id main-baseline
 *   RUST_SKILLS_SUBJECT_ROOT=../rust-skills         npm run agents:quick-real -- --run-id feature-baseline
 *   node scripts/compare-reports.mjs \
 *     --a results/agent-matrix/main-baseline/report.json \
 *     --b results/agent-matrix/feature-baseline/report.json \
 *     --label-a main --label-b feature --out docs/comparison.md
 */
import fs from "node:fs";
import path from "node:path";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function pct(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function delta(a, b) {
  const d = Number(b || 0) - Number(a || 0);
  const sign = d > 0 ? "+" : "";
  return `${sign}${(d * 100).toFixed(1)}pp`;
}

function indicator(d) {
  const v = Number(d || 0);
  if (v > 0.01) return "↑";
  if (v < -0.01) return "↓";
  return "=";
}

function compareProfiles(summaryA, summaryB) {
  const profiles = [...new Set([
    ...Object.keys(summaryA.profiles || {}),
    ...Object.keys(summaryB.profiles || {})
  ])].sort();
  return profiles.map((profile) => {
    const a = summaryA.profiles?.[profile] || {};
    const b = summaryB.profiles?.[profile] || {};
    return {
      profile,
      a,
      b,
      deltas: {
        qualityGatePassRate: Number(b.qualityGatePassRate || 0) - Number(a.qualityGatePassRate || 0),
        responseGenerationRate: Number(b.responseGenerationRate || 0) - Number(a.responseGenerationRate || 0),
        artifactGenerationRate: Number(b.artifactGenerationRate || 0) - Number(a.artifactGenerationRate || 0),
        patchGenerationRate: Number(b.patchGenerationRate || 0) - Number(a.patchGenerationRate || 0),
        timeoutRate: Number(b.timeoutRate || 0) - Number(a.timeoutRate || 0)
      }
    };
  });
}

function compareCategories(summaryA, summaryB) {
  const cats = [...new Set([
    ...Object.keys(summaryA.categories || {}),
    ...Object.keys(summaryB.categories || {})
  ])].sort();
  return cats.map((cat) => {
    const a = summaryA.categories?.[cat] || {};
    const b = summaryB.categories?.[cat] || {};
    return {
      category: cat,
      a: { quality: a.qualityGatePassRate, total: a.total },
      b: { quality: b.qualityGatePassRate, total: b.total },
      delta: Number(b.qualityGatePassRate || 0) - Number(a.qualityGatePassRate || 0)
    };
  });
}

function markdown(reportA, reportB, labelA, labelB) {
  const { summary: sa } = reportA;
  const { summary: sb } = reportB;
  const profileComps = compareProfiles(sa, sb);
  const catComps = compareCategories(sa, sb);

  const lines = [
    `# Bench Comparison: ${labelA} vs ${labelB}`,
    "",
    `| | ${labelA} | ${labelB} | Delta |`,
    `|---|---|---|---|`,
    `| Run ID | ${reportA.runId} | ${reportB.runId} | |`,
    `| Generated | ${reportA.generatedAt?.slice(0, 19) || "-"} | ${reportB.generatedAt?.slice(0, 19) || "-"} | |`,
    `| Subject | ${path.basename(reportA.subjectRoot || "-")} | ${path.basename(reportB.subjectRoot || "-")} | |`,
    `| Total cases | ${sa.total} | ${sb.total} | ${sa.total === sb.total ? "=" : "!"} |`,
    `| Skipped | ${sa.skipped} | ${sb.skipped} | |`,
    `| Quality gate pass | ${pct(sa.qualityGatePassRate)} | ${pct(sb.qualityGatePassRate)} | **${delta(sa.qualityGatePassRate, sb.qualityGatePassRate)}** ${indicator(Number(sb.qualityGatePassRate||0) - Number(sa.qualityGatePassRate||0))} |`,
    `| Response gen rate | ${pct(sa.responseGenerationRate)} | ${pct(sb.responseGenerationRate)} | ${delta(sa.responseGenerationRate, sb.responseGenerationRate)} |`,
    `| Timeout rate | ${pct(sa.timeoutRate)} | ${pct(sb.timeoutRate)} | ${delta(sa.timeoutRate, sb.timeoutRate)} |`,
    "",
    "## By Profile",
    "",
    `| Profile | ${labelA} quality | ${labelB} quality | Delta |`,
    "|---------|----------|----------|-------|"
  ];
  for (const { profile, a, b, deltas } of profileComps) {
    lines.push(`| ${profile} | ${pct(a.qualityGatePassRate)} | ${pct(b.qualityGatePassRate)} | **${delta(a.qualityGatePassRate, b.qualityGatePassRate)}** ${indicator(deltas.qualityGatePassRate)} |`);
  }
  lines.push("", "## By Category", "", `| Category | ${labelA} | ${labelB} | Delta |`, "|----------|------|------|-------|");
  for (const { category, a, b, delta: d } of catComps) {
    lines.push(`| ${category} | ${pct(a.quality)} | ${pct(b.quality)} | ${delta(a.quality, b.quality)} ${indicator(d)} |`);
  }

  const baseline_a = sa.profiles?.["baseline"] || {};
  const rs_a = sa.profiles?.["rust-skills"] || {};
  const baseline_b = sb.profiles?.["baseline"] || {};
  const rs_b = sb.profiles?.["rust-skills"] || {};
  if (rs_a.qualityGatePassRate !== undefined && rs_b.qualityGatePassRate !== undefined) {
    const lift_a = Number(rs_a.qualityGatePassRate || 0) - Number(baseline_a.qualityGatePassRate || 0);
    const lift_b = Number(rs_b.qualityGatePassRate || 0) - Number(baseline_b.qualityGatePassRate || 0);
    lines.push(
      "",
      "## rust-skills Lift (vs baseline within each run)",
      "",
      `| | ${labelA} | ${labelB} |`,
      `|---|---|---|`,
      `| Baseline quality | ${pct(baseline_a.qualityGatePassRate)} | ${pct(baseline_b.qualityGatePassRate)} |`,
      `| rust-skills quality | ${pct(rs_a.qualityGatePassRate)} | ${pct(rs_b.qualityGatePassRate)} |`,
      `| **Lift** | **${delta(baseline_a.qualityGatePassRate, rs_a.qualityGatePassRate)}** | **${delta(baseline_b.qualityGatePassRate, rs_b.qualityGatePassRate)}** |`,
      `| Lift delta (${labelB} − ${labelA}) | | **${delta(lift_a, lift_b)} ${indicator(lift_b - lift_a)}** |`
    );
  }

  lines.push("", "## Source Reports", "", `- ${labelA}: \`${reportA.runRoot || "-"}\``, `- ${labelB}: \`${reportB.runRoot || "-"}\``);
  return `${lines.join("\n")}\n`;
}

const pathA = argValue("--a");
const pathB = argValue("--b");
if (!pathA || !pathB) throw new Error("--a and --b report paths are required");
const labelA = argValue("--label-a", "a");
const labelB = argValue("--label-b", "b");
const outputPath = argValue("--out", null);

const reportA = JSON.parse(fs.readFileSync(pathA, "utf8"));
const reportB = JSON.parse(fs.readFileSync(pathB, "utf8"));

const profileComps = compareProfiles(reportA.summary, reportB.summary);
const catComps = compareCategories(reportA.summary, reportB.summary);
const delta_obj = {
  labelA,
  labelB,
  runIdA: reportA.runId,
  runIdB: reportB.runId,
  overall: {
    qualityGatePassRateDelta: Number(reportB.summary.qualityGatePassRate || 0) - Number(reportA.summary.qualityGatePassRate || 0),
    responseGenerationRateDelta: Number(reportB.summary.responseGenerationRate || 0) - Number(reportA.summary.responseGenerationRate || 0),
    timeoutRateDelta: Number(reportB.summary.timeoutRate || 0) - Number(reportA.summary.timeoutRate || 0)
  },
  profiles: Object.fromEntries(profileComps.map(({ profile, deltas }) => [profile, deltas])),
  categories: Object.fromEntries(catComps.map(({ category, delta: d }) => [category, { qualityGatePassRateDelta: d }]))
};

if (outputPath) {
  ensureDir(path.dirname(outputPath));
  const content = outputPath.endsWith(".md")
    ? markdown(reportA, reportB, labelA, labelB)
    : `${JSON.stringify(delta_obj, null, 2)}\n`;
  fs.writeFileSync(outputPath, content);
  console.log(JSON.stringify({ status: "PASS", output: outputPath }, null, 2));
} else {
  console.log(JSON.stringify(delta_obj, null, 2));
}
