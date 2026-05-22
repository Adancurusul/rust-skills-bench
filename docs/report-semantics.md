# Report Semantics

Each run writes a `report.json` and per-run capsules under `results/`.

## Status Values

| Status | Meaning |
|--------|---------|
| `PASS` | All runnable samples passed quality gates and real-agent requirements. |
| `MEASURED` | Real agents ran, but one or more quality gates failed in benchmark mode. |
| `FAIL` | Harness execution failed, required real agents were missing, or benchmark mode was not enabled for quality failures. |

## Capsule Evidence

Each sample records:

- original prompt and final prompt
- engine, profile, repeat, category, difficulty, tags
- routing summary and skill context metadata
- stdout, stderr, output, and workspace diff
- expected file evidence
- verification command results
- normalized failure reasons

## Comparison Policy

Compare profiles only within the same run shape: same cases, engines, repeats,
timeouts, concurrency, and subject commit. Record the subject repository commit
in the run notes or summary when publishing evidence.

Use profile deltas as directional signals, not proof from a single run. Stable
claims should come from multiple repeats and at least one code-generation slice.
