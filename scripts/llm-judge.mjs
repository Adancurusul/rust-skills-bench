#!/usr/bin/env node
/**
 * LLM-as-judge: post-hoc semantic evaluation of agent responses.
 *
 * Usage:
 *   node scripts/llm-judge.mjs \
 *     --report results/agent-matrix/<run-id>/report.json \
 *     --cases fixtures/agent-matrix-comprehensive.json \
 *     [--out results/agent-matrix/<run-id>/report-judged.json]
 *
 * For each capsule in the report that has a real response (not SKIP/TIMEOUT)
 * and whose fixture defines expected.llmJudge, calls `claude --print` with
 * the original question + response + rubric, parses a JSON score, and emits
 * an augmented report with llmScore fields added to each capsule.
 *
 * Judge model: claude --print (non-interactive, bypassPermissions not needed here).
 * Score: 1-5. Pass threshold: llmJudge.minScore (default 3).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function splitCsv(value) {
  return String(value || "").split(",").map((s) => s.trim()).filter(Boolean);
}

function loadCaseIndex(casePaths) {
  const index = new Map();
  for (const casePath of casePaths) {
    const abs = path.resolve(casePath);
    if (!fs.existsSync(abs)) {
      process.stderr.write(`[warn] cases file not found: ${abs}\n`);
      continue;
    }
    const loaded = readJson(abs);
    const items = Array.isArray(loaded) ? loaded : loaded.cases;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (item.id && item.expected?.llmJudge) {
        index.set(item.id, item);
      }
    }
  }
  return index;
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    });
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
    }, options.timeoutMs || 60000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
    child.on("error", (err) => {
      clearTimeout(timeout);
      resolve({ code: null, stdout, stderr, error: err.message });
    });
  });
}

function buildJudgePrompt(question, response, criteria) {
  return [
    "You are a strict evaluator scoring an AI assistant's Rust answer.",
    "",
    "## Original Question",
    question.trim(),
    "",
    "## Response to Evaluate",
    response.trim(),
    "",
    "## Evaluation Criteria",
    criteria.trim(),
    "",
    "## Scoring",
    "Rate the response 1-5:",
    "  1 = completely misses the point or is wrong",
    "  2 = partially wrong or missing major pieces",
    "  3 = adequate — addresses the key question, minor gaps are OK",
    "  4 = good — accurate and reasonably complete",
    "  5 = excellent — thorough, accurate, covers all key points",
    "",
    "Reply with ONLY a JSON object on a single line, no markdown, no explanation:",
    '{"score": <1-5>, "reasoning": "<one sentence>", "pass": <true if score >= 3>}'
  ].join("\n");
}

function parseJudgeOutput(raw) {
  // Extract the LAST JSON object with a score (the pane may echo the prompt's
  // example JSON before the real answer; take the last match to win).
  const matches = [...String(raw).matchAll(/\{[^{}]*"score"[^{}]*\}/g)];
  const jsonMatch = matches.length ? matches[matches.length - 1][0] : null;
  if (!jsonMatch) {
    return { score: null, reasoning: `judge returned unparseable output: ${String(raw).slice(-200)}`, pass: null, error: true };
  }
  // The TUI pane wraps long lines, injecting newlines + indentation inside the
  // one-line JSON the model emitted. Collapse intra-JSON whitespace runs back to
  // single spaces so JSON.parse doesn't choke on the wrap artifacts.
  const cleaned = jsonMatch.replace(/\s*\n\s*/g, " ");
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.score !== "number") {
      return { score: null, reasoning: "judge returned JSON without numeric score", pass: null, error: true };
    }
    return {
      score: parsed.score,
      reasoning: parsed.reasoning || "",
      pass: typeof parsed.pass === "boolean" ? parsed.pass : parsed.score >= 3,
      error: false
    };
  } catch {
    return { score: null, reasoning: `JSON parse failed: ${cleaned.slice(0, 200)}`, pass: null, error: true };
  }
}

async function judgeViaCodex(prompt) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-judge-"));
  const outputFile = path.join(tmpDir, "output.txt");
  try {
    const result = await runProcess("codex", [
      "exec", "-C", tmpDir, "--skip-git-repo-check", "--ephemeral",
      "--ignore-user-config", "--ignore-rules", "-s", "workspace-write",
      "-o", outputFile, prompt
    ], { timeoutMs: 90000 });
    if (result.code !== 0 && !fs.existsSync(outputFile)) {
      return { score: null, reasoning: `judge process failed (exit ${result.code}): ${result.stderr.slice(0, 200)}`, pass: null, error: true };
    }
    const raw = (fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : result.stdout).trim();
    return parseJudgeOutput(raw);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

// cc-tui judge: reuse the same PTY/tmux Claude Code path the bench engine uses,
// because headless `claude -p` fails OAuth on this host (401). Shells out to
// scripts/cc-tui-engine.sh <promptFile> <outputFile> and parses the pane dump.
async function judgeViaCcTui(prompt) {
  const engineScript = path.join(path.dirname(new URL(import.meta.url).pathname), "cc-tui-engine.sh");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-judge-cctui-"));
  const promptFile = path.join(tmpDir, "prompt.txt");
  const outputFile = path.join(tmpDir, "output.txt");
  fs.writeFileSync(promptFile, prompt);
  try {
    const result = await runProcess("bash", [engineScript, promptFile, outputFile, tmpDir], { timeoutMs: 180000 });
    if (!fs.existsSync(outputFile)) {
      return { score: null, reasoning: `cc-tui judge produced no output (exit ${result.code}): ${(result.stderr || "").slice(0, 200)}`, pass: null, error: true };
    }
    const raw = fs.readFileSync(outputFile, "utf8").trim();
    return parseJudgeOutput(raw);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

async function judge(question, response, criteria, engine) {
  const prompt = buildJudgePrompt(question, response, criteria);
  return engine === "codex" ? judgeViaCodex(prompt) : judgeViaCcTui(prompt);
}

async function main() {
  const reportPath = argValue("--report");
  if (!reportPath) throw new Error("--report is required");

  const casesArg = argValue(
    "--cases",
    path.join(path.dirname(path.dirname(new URL(import.meta.url).pathname)), "fixtures", "agent-matrix-comprehensive.json")
  );
  const casePaths = splitCsv(casesArg);
  const outputPath = argValue("--out", null);
  const dryRun = process.argv.includes("--dry-run");
  const caseFilter = argValue("--case-filter", null);
  const profileFilter = argValue("--profile", null);
  const engineFilter = argValue("--engine", null);
  // Judge engine: cc-tui (default; PTY Claude Code) or codex. Headless claude -p
  // fails OAuth here, so cc-tui is the working default.
  const judgeEngine = argValue("--judge-engine", "cc-tui");
  // Dual-gate mode: only re-judge capsules the phrase gate FAILED. The judge can
  // rescue a false-negative (right answer, wrong wording) but never downgrades a
  // phrase-gate PASS. This is the P0-2 "judge on fail" path.
  const onlyFailures = process.argv.includes("--only-failures");

  const report = readJson(reportPath);
  const caseIndex = loadCaseIndex(casePaths);

  if (caseIndex.size === 0) {
    process.stderr.write("[warn] no cases with llmJudge criteria found in fixtures\n");
  } else {
    process.stderr.write(`[info] ${caseIndex.size} case(s) have llmJudge criteria\n`);
  }

  const capsules = report.results || report.capsules || [];
  let judged = 0;
  let skipped = 0;
  let errors = 0;

  const augmented = [];
  for (const capsule of capsules.filter(Boolean)) {
    if (
      (caseFilter && capsule.caseId !== caseFilter && !(capsule.tags || []).includes(caseFilter)) ||
      (profileFilter && capsule.profile !== profileFilter) ||
      (engineFilter && capsule.engine !== engineFilter)
    ) {
      augmented.push(capsule);
      continue;
    }

    const caseItem = caseIndex.get(capsule.caseId);
    if (!caseItem) {
      augmented.push(capsule);
      skipped += 1;
      continue;
    }

    // Dual-gate: only re-judge phrase-gate failures (the false-negative suspects).
    if (onlyFailures && capsule.hardGate === "PASS") {
      augmented.push(capsule);
      skipped += 1;
      continue;
    }

    if (capsule.status === "SKIP" || capsule.status === "TIMEOUT") {
      augmented.push({ ...capsule, llmScore: { skipped: true, reason: capsule.status } });
      skipped += 1;
      continue;
    }

    const outputFile = capsule.outputFile;
    if (!outputFile || !fs.existsSync(outputFile)) {
      augmented.push({ ...capsule, llmScore: { skipped: true, reason: "output file missing" } });
      skipped += 1;
      continue;
    }

    const response = fs.readFileSync(outputFile, "utf8");
    if (!response.trim()) {
      augmented.push({ ...capsule, llmScore: { skipped: true, reason: "empty response" } });
      skipped += 1;
      continue;
    }

    const { criteria, minScore = 3 } = caseItem.expected.llmJudge;
    const label = `${capsule.caseId}/${capsule.profile}/${capsule.engine}`;

    if (dryRun) {
      process.stderr.write(`[dry-run] would judge: ${label}\n`);
      augmented.push({ ...capsule, llmScore: { dryRun: true } });
      judged += 1;
      continue;
    }

    process.stderr.write(`[judging via ${judgeEngine}] ${label}...\n`);
    const result = await judge(caseItem.prompt, response, criteria, judgeEngine);
    const llmScore = {
      score: result.score,
      minScore,
      pass: result.error ? null : result.score >= minScore,
      reasoning: result.reasoning,
      error: result.error || false
    };
    process.stderr.write(`  → score=${result.score ?? "?"} pass=${llmScore.pass} ${result.reasoning?.slice(0, 80)}\n`);

    augmented.push({ ...capsule, llmScore });
    if (result.error) errors += 1;
    else judged += 1;
  }

  // Build augmented report with llmJudge summary
  const llmPassed = augmented.filter((c) => c.llmScore?.pass === true).length;
  const llmFailed = augmented.filter((c) => c.llmScore?.pass === false).length;
  const llmTotal = llmPassed + llmFailed;

  // Dual-gate: judgedGate = phrase gate PASS, OR (phrase gate FAIL rescued by a
  // judge PASS). Judge never downgrades a phrase-gate PASS. Report raw vs judged
  // pass rate per profile so phrase false-negatives stop distorting lift.
  const judgedPass = (c) => c.hardGate === "PASS" || c.llmScore?.pass === true;
  const runnable = augmented.filter((c) => c.status !== "SKIP" && c.status !== "TIMEOUT");
  const profileNames = [...new Set(runnable.map((c) => c.profile || "baseline"))];
  const dualGate = {};
  for (const profile of profileNames) {
    const rows = runnable.filter((c) => (c.profile || "baseline") === profile);
    const rawPass = rows.filter((c) => c.hardGate === "PASS").length;
    const jPass = rows.filter(judgedPass).length;
    const rescued = rows.filter((c) => c.hardGate === "FAIL" && c.llmScore?.pass === true)
      .map((c) => c.caseId);
    dualGate[profile] = {
      total: rows.length,
      rawGatePassRate: rows.length ? Number((rawPass / rows.length).toFixed(4)) : null,
      judgedPassRate: rows.length ? Number((jPass / rows.length).toFixed(4)) : null,
      rescuedByJudge: rescued
    };
  }
  if (dualGate.baseline && dualGate["rust-skills"]) {
    dualGate.comparison = {
      rawGatePassRateDelta: Number((dualGate["rust-skills"].rawGatePassRate - dualGate.baseline.rawGatePassRate).toFixed(4)),
      judgedPassRateDelta: Number((dualGate["rust-skills"].judgedPassRate - dualGate.baseline.judgedPassRate).toFixed(4))
    };
  }

  const augmentedReport = {
    ...report,
    capsules: augmented,
    llmJudgeSummary: {
      judged,
      skipped,
      errors,
      passed: llmPassed,
      failed: llmFailed,
      total: llmTotal,
      passRate: llmTotal > 0 ? Number((llmPassed / llmTotal).toFixed(4)) : null
    },
    dualGateSummary: dualGate
  };

  const out = JSON.stringify(augmentedReport, null, 2);
  if (outputPath) {
    ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, `${out}\n`);
    process.stderr.write(`[done] wrote ${outputPath}\n`);
  } else {
    process.stdout.write(`${out}\n`);
  }

  // Print summary to stderr
  process.stderr.write([
    "",
    "=== LLM Judge Summary ===",
    `Judged: ${judged}  Skipped: ${skipped}  Errors: ${errors}`,
    `Passed: ${llmPassed}/${llmTotal} (${llmTotal > 0 ? ((llmPassed / llmTotal) * 100).toFixed(1) : "-"}%)`,
    ""
  ].join("\n"));
}

main().catch((err) => {
  process.stderr.write(`[fatal] ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
