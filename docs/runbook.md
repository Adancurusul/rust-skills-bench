# Runbook

## Local Setup

```bash
npm test
cp bench.config.example.json bench.config.json
```

Edit `bench.config.json` for machine-specific paths or defaults. The file is
ignored by git.

## Dry Verification

```bash
npm run audit
npm run smoke:dry
```

Dry runs do not launch real agents. They prove fixture shape, routing, prompt
construction, and evidence capsule writing.

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

## Reporting

```bash
npm run report -- \
  --report results/agent-matrix/<run-id>/report.json \
  --out results/<run-id>.md
```

Result directories are intentionally ignored. Commit curated summaries only
when they are stable and reviewable.
