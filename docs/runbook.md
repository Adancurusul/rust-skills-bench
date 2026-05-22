# Runbook

## Local Setup

```bash
npm test
cp bench.config.example.json bench.config.json
```

Edit `bench.config.json` for machine-specific paths or defaults. The file is
ignored by git.

Run a prerequisite check directly when diagnosing a machine:

```bash
npm run doctor
```

## Dry Verification

```bash
npm run audit:all
npm run smoke:dry:all
```

Dry runs do not launch real agents. They prove fixture shape, routing, prompt
construction, and evidence capsule writing.

## Real Quick Run

```bash
npm run agents:quick-real
```

This launches real `codex` and `claude-code` processes for the quick-tagged
case across `baseline` and `rust-skills`. It is the fastest evidence-producing
real run.

## Real Focused Run

```bash
RUN_REAL_AGENTS=1 node scripts/run-agent-matrix.mjs \
  --case-filter answer-ownership-api-e0382 \
  --engines codex,claude-code \
  --profiles baseline,rust-skills \
  --repeats 3 \
  --concurrency 4 \
  --benchmark-mode \
  --require-real-agents
```

## Real Code Generation Run

```bash
npm run agents:codegen
```

Code-generation cases copy fixtures from the subject repository, run agents in
isolated workspaces, and execute verification commands such as `cargo test`.

## Rust Public-Eval-Inspired Runs

Run the fastest real smoke for the Rust-specific public-eval-inspired suite:

```bash
npm run agents:rust-evals-smoke
```

Run the compiler diagnostics slice:

```bash
npm run agents:rust-diagnostics
```

These runs are prompt-original but dimensionally inspired by Rust API evolution,
compiler-error repair, repository-level issue resolution, and harder polyglot
coding benchmarks. Do not copy public benchmark tasks verbatim into this suite.

## Full Local Matrix

```bash
npm run agents:all
```

This runs every bundled case from `fixtures/agent-matrix-comprehensive.json`
and `fixtures/prompt-suites/rust-skills-expanded.json` with three repeats
across both profiles and the built-in engines. Use benchmark mode results as
measurement: if `rust-skills` underperforms, keep the fixture fixed and improve
the subject skills or runtime.

## Custom Agent Adapter

Set `engineAdapters` in `bench.config.json` to route a non-built-in Agent CLI
through the same harness:

```json
{
  "engines": ["custom-local"],
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

The adapter receives a real workspace and must write the final answer to
`{{outputFile}}`. Supported tokens are `{{prompt}}`, `{{promptFile}}`,
`{{workspace}}`, `{{outputFile}}`, and `{{runDir}}`.

## Reporting

```bash
npm run report -- \
  --report results/agent-matrix/<run-id>/report.json \
  --out results/<run-id>.md
```

Result directories are intentionally ignored. Commit curated summaries only
when they are stable and reviewable.
