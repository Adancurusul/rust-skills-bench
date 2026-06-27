# rust-skills-bench

Real Agent benchmark harness for comparing baseline agents with `rust-skills`
injection.

This repository is intentionally separate from `rust-skills`:

- `rust-skills` stays focused on skills, routing, install, and lightweight
  verification gates.
- `rust-skills-bench` owns large fixtures, real Agent runs, local/remote
  comparison matrices, and durable benchmark reports.

## Subject Repository

By default the scripts expect the subject repository at:

```bash
../rust-skills
```

Override it when needed:

```bash
export RUST_SKILLS_SUBJECT_ROOT=/path/to/rust-skills
```

or pass:

```bash
--subject-root /path/to/rust-skills
```

## Local Configuration

Copy the example config for machine-specific defaults:

```bash
cp bench.config.example.json bench.config.json
```

`bench.config.json` is intentionally ignored by git. It can set the subject
repository, result directory, engines, profiles, repeats, concurrency, timeout,
and whether real agents are enabled by default.

Every script also accepts:

```bash
--config /path/to/bench.config.json
```

## Commands

Run the external quick check. This is the recommended first command for a new
machine because it checks local prerequisites, audits all fixtures, and writes
dry-run evidence capsules without spending real Agent calls:

```bash
npm test
```

List the benchmark taxonomy and case catalog:

```bash
npm run cases:all
```

Audit fixture breadth and fairness:

```bash
npm run audit:all
```

Run a dry smoke without launching real agents:

```bash
npm run smoke:dry:all
```

Run a real focused benchmark:

```bash
npm run agents:quick-real
```

Run real code-generation comparison:

```bash
npm run agents:codegen
```

Run Rust public-eval-inspired slices:

```bash
npm run agents:rust-evals-smoke
npm run agents:rust-diagnostics
```

Run the full local matrix across all bundled prompt suites:

```bash
npm run agents:all
```

`agents:all` is intentionally expensive. It runs real Agent processes with the
same prompts across `baseline` and `rust-skills` profiles.

Generate a Markdown summary from a JSON report:

```bash
npm run report -- --report results/agent-matrix/<run-id>/report.json --out results/<run-id>.md
```

## Statistical Bench (repeats=3)

For statistically stable lift comparisons, use the `codex3` scripts that run
each case 3 times with the Codex engine (no OAuth required):

```bash
# Feature branch
RUST_SKILLS_SUBJECT_ROOT=../rust-skills \
  npm run agents:quick-real:feature:codex3

# Main branch (point at a second checkout)
RUST_SKILLS_SUBJECT_ROOT=../rust-skills-main \
  npm run agents:quick-real:main:codex3
```

These write to `results/agent-matrix/codex3-feature/` and
`results/agent-matrix/codex3-main/` respectively. With `repeats=3`, each
case runs three times per profile, reducing single-sample noise from ±8 pp
to ±3 pp.

## Comparing Two Runs

```bash
node scripts/compare-reports.mjs \
  --a results/agent-matrix/<run-a>/report.json \
  --b results/agent-matrix/<run-b>/report.json \
  --label-a main --label-b feature
```

The output shows overall quality-gate delta, per-profile deltas (baseline vs
rust-skills), per-category deltas, and the rust-skills lift above baseline
for each run.

Full workflow:

```bash
# 1. Run bench against main checkout
RUST_SKILLS_SUBJECT_ROOT=/path/to/rust-skills-main \
  npm run agents:quick-real:main:codex3

# 2. Run bench against feature checkout
RUST_SKILLS_SUBJECT_ROOT=/path/to/rust-skills-feature \
  npm run agents:quick-real:feature:codex3

# 3. Compare
node scripts/compare-reports.mjs \
  --a results/agent-matrix/codex3-main/report.json \
  --b results/agent-matrix/codex3-feature/report.json \
  --label-a main --label-b feature
```

## CC-TUI Engine

The `cc-tui` engine runs cases through a real `claude` TUI session via tmux.
It requires:

1. `claude` CLI installed and authenticated (OAuth, not API key)
2. `tmux` installed
3. A `bench.config.json` with the `cc-tui` engine adapter:

```json
{
  "engines": ["codex", "cc-tui"],
  "engineAdapters": {
    "cc-tui": {
      "command": "bash",
      "args": ["/absolute/path/to/scripts/cc-tui-engine.sh",
               "{{promptFile}}", "{{outputFile}}", "{{workspace}}"]
    }
  }
}
```

See `bench.config.example.json` for the full structure.

The CC-TUI engine captures the full tmux scrollback (`capture-pane -S -`) into
`output.md`. The captured content includes the pasted prompt (with skill
content, if any) plus the model's response. This is symmetric across branches,
so relative comparisons are valid. Absolute `mustMention` scores will be
inflated vs baseline-only runs because skill keywords appear in the pasted
prompt.

Run CC-TUI cases:

```bash
RUST_SKILLS_SUBJECT_ROOT=../rust-skills RUN_REAL_AGENTS=1 \
  node scripts/run-agent-matrix.mjs \
  --cases fixtures/agent-matrix-comprehensive.json \
  --case-filter quick --engines cc-tui --profiles baseline,rust-skills \
  --run-id cc-tui-feature
```

## LLM Judge

After a bench run, apply semantic evaluation on cases with `llmJudge` criteria
defined in the fixture:

```bash
node scripts/llm-judge.mjs \
  --report results/agent-matrix/<run-id>/report.json \
  --cases fixtures/agent-matrix-comprehensive.json \
  --out results/agent-matrix/<run-id>/report-judged.json
```

The judge uses `codex exec` for semantic evaluation and augments the report
with a `llmScore` field per capsule. The original report is not modified.

## Benchmark Results (v2.2.0 vs v2.0.x)

### Codex engine — repeats=3 (run IDs: codex3-feature / codex3-main)

| Profile | Feature | Main | Delta |
|---------|---------|------|-------|
| baseline | 17/18 (94.4%) | 17/18 (94.4%) | 0 pp |
| rust-skills | 18/18 (100.0%) | 17/18 (94.4%) | **+5.6 pp** |

**Identical baselines** (same case fails for both at the same rate) confirm the
bench is symmetric — the only difference is the skill injection path.

The single delta case is `api-evolution-msrv-stabilization`:

- **Feature** routes the MSRV prompt to `['rust-router', 'm11-ecosystem']`. The
  m11-ecosystem skill covers API Evolution, MSRV, semver impact, and downstream
  considerations. All 3 repeats pass.
- **Main** routes to `['rust-router']` only. Without m11-ecosystem content, the
  model inconsistently mentions semver/changelog terms. 1 of 3 repeats fails
  (missing "semver | release notes | changelog | versioning | breaking change |
  document the change").

Root cause is mechanical and reproducible: CLI runtime routing adds m11-ecosystem
for MSRV prompts; main does not.

### CC-TUI engine — repeats=1 (run IDs: cc-tui-feature-v2 / cc-tui-main-v2)

| Profile | Feature | Main |
|---------|---------|------|
| baseline | 6/6 (100%) | 6/6 (100%) |
| rust-skills | 6/6 (100%) | 5/6 (83.3%) |

Main's one failure: `artifact-review-checklist | rust-skills` wrote
`"mechanically checked review gate"` (singular) where the fixture requires
`"mechanically checked review gates"` (plural).

**Caveat**: CC-TUI runs are single-shot (repeats=1). The failure is a
single-word difference and could flip on a re-run. Directionally consistent
with Codex, but repeats=3 is needed for the same statistical confidence.

## Custom Engines

The built-in engines are `codex` and `claude-code`. Other real Agent CLIs can
be added in `bench.config.json` with `engineAdapters`:

```json
{
  "engines": ["codex", "custom-local"],
  "engineAdapters": {
    "custom-local": {
      "command": "sh",
      "args": [
        "-lc",
        "${AGENT_CMD:?set AGENT_CMD} < \"{{promptFile}}\" > \"{{outputFile}}\""
      ]
    }
  }
}
```

Supported adapter tokens are `{{prompt}}`, `{{promptFile}}`, `{{workspace}}`,
`{{outputFile}}`, and `{{runDir}}`.

## Policy

Fixtures must stay product-neutral. Prompts must not mention `rust-skills`,
baseline, this repository, or ask one profile to outperform another.

Benchmark failures are data. If `rust-skills` underperforms, fix the subject
skills/runtime, not the fixture expectations or scoring rules.

Aragorn/workflow files are not part of this repository. Keep `doc/`,
`.aragorn/`, workflow state, local reports, and private machine configuration
out of git.

## Documentation

- [Benchmark Taxonomy](docs/benchmark-taxonomy.md)
- [Case Catalog](docs/case-catalog.md)
- [Open Source Eval Notes](docs/open-source-eval-notes.md)
- [Runbook](docs/runbook.md)
- [Report Semantics](docs/report-semantics.md)
