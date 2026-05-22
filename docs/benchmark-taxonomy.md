# Benchmark Taxonomy

The suite is organized by task surface, difficulty, and tags. Categories are
stable enough for trend charts; tags are intentionally richer and can overlap.

## Categories

| Category | Purpose | Primary Signals |
|----------|---------|-----------------|
| `answer-quality` | Measures conceptual answers without file edits. | Required terms, minimum response length, forbidden phrases. |
| `artifact-generation` | Measures structured written artifacts. | Expected files and required text in files. |
| `review-debugging` | Measures code review and diagnosis quality. | Missing bug/risk terms and actionable repair guidance. |
| `code-generation` | Measures real code edits. | Patch generation plus verification commands such as `cargo test`. |

## Difficulty

| Difficulty | Meaning |
|------------|---------|
| `medium` | Common Rust task with one or two expected concepts. |
| `hard` | Cross-concept task, multi-step diagnosis, or artifact structure. |
| `expert` | Soundness, unsafe, or deeper architectural tradeoff. |

## Profiles

| Profile | Meaning |
|---------|---------|
| `baseline` | Sends the raw product-neutral prompt to the agent. |
| `rust-skills` | Routes the same prompt through the subject repository and injects routed skill excerpts. |

## Engines

The harness includes built-in support for `codex` and `claude-code`. Additional
real Agent CLIs can be configured through `engineAdapters` in
`bench.config.json`. Each run records the engine, profile, repeat number,
routing capsule, prompt, output, workspace diff, verification commands, and
failure reasons.

## Prompt Suites

| Suite | Path | Purpose |
|-------|------|---------|
| Comprehensive | `fixtures/agent-matrix-comprehensive.json` | Original broad real-Agent matrix across answer, artifact, review, and code generation surfaces. |
| Expanded Rust Skills | `fixtures/prompt-suites/rust-skills-expanded.json` | Harder and wider product-neutral prompts for ownership, async, unsafe, FFI, embedded/no-std, review-debugging, and operational artifacts. |

## Metrics

| Metric | Meaning |
|--------|---------|
| `responseGenerationRate` | Non-empty agent output was produced. |
| `artifactGenerationRate` | All expected files were created. |
| `patchGenerationRate` | The workspace contains a git diff after the run. |
| `qualityGatePassRate` | Text/file expectations and verification commands passed. |
| `timeoutRate` | Agent process timed out. |

Text expectations support exact required phrases and `mustMentionAny` groups
for cases where several equivalent terms are acceptable. This keeps the
benchmark less brittle while still checking that the answer covers the intended
concept.

Quality failures are benchmark data. Do not weaken fixtures or scoring to make
a profile look better.
