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
