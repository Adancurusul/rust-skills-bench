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

## Commands

Audit fixture breadth and fairness:

```bash
npm run audit
```

Run a dry smoke without launching real agents:

```bash
npm run smoke:dry
```

Run a real focused benchmark:

```bash
npm run agents:focused
```

Run real code-generation comparison:

```bash
npm run agents:codegen
```

Generate a Markdown summary from a JSON report:

```bash
npm run report -- --report results/agent-matrix/<run-id>/report.json --out results/<run-id>.md
```

## Policy

Fixtures must stay product-neutral. Prompts must not mention `rust-skills`,
baseline, this repository, or ask one profile to outperform another.

Benchmark failures are data. If `rust-skills` underperforms, fix the subject
skills/runtime, not the fixture expectations or scoring rules.
