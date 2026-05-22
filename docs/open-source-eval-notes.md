# Open Source Eval Notes

This repository stays lightweight and Node-first, but the design is aligned
with common patterns from open evaluation projects:

| Project | Useful pattern for this bench |
|---------|-------------------------------|
| [OpenAI Evals](https://github.com/openai/evals) | Keep reusable eval fixtures and allow custom evals for local use cases. |
| [SWE-bench](https://github.com/swe-bench) | Treat real software engineering issues and execution logs as durable evidence, not just chat transcript quality. |
| [AgentBench](https://github.com/THUDM/AgentBench) | Evaluate agents across diverse environments instead of one narrow task type. |
| [Inspect](https://github.com/UKGovernmentBEIS/inspect_ai) | Separate solver, scorer, prompt/tool-use surface, and report output so new evals can be added without changing the runner. |
| [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) | Support multiple model backends behind one CLI contract. |
| [Aider Polyglot Benchmark](https://aider.chat/2024/12/21/polyglot.html) | Prefer harder, more diverse coding tasks when easy tasks stop distinguishing strong systems. |

## Rust-Specific Sources

| Project or paper | Rust dimension to cover |
|------------------|-------------------------|
| [RustEvo²](https://github.com/SYSUSELab/RustEvo) | Version-aware API evolution: stabilization, signature changes, behavior changes, and deprecation. |
| [Fixing Rust Compilation Errors using LLMs](https://arxiv.org/abs/2308.05177) | Compiler diagnostic repair for ownership, lifetime, trait bound, and error-type failures. |
| [Rust-SWE-bench / RUSTFORGER](https://arxiv.org/abs/2602.22764) | Repository-level issue reproduction, Rust type and trait semantics, and dynamic validation. |
| [MultiPL-E](https://git.hubp.de/nuprl/agnostics-MultiPL-E) | Executable Rust code-generation tasks with containerized or isolated execution. |
| [EvalPlus](https://evalplus.github.io/) | Stronger hidden-style tests and performance-sensitive evaluation instead of thin examples. |
| [Aider Polyglot Benchmark](https://aider.chat/2024/12/21/polyglot.html) | Harder Rust coding problems selected to avoid saturated, too-easy benchmarks. |

Bench decisions derived from those patterns:

- Fixtures are plain JSON and product-neutral.
- Results are reproducible files under `results/`, with per-sample capsules.
- The runner supports built-in agents and configurable external engines.
- Dry runs validate evidence shape; real runs launch actual agent processes.
- Benchmark failures are measured outcomes. The fix path is changing the
  subject skills/runtime, not weakening tests after seeing scores.
- Public benchmarks inform dimensions only. Do not copy their prompts or
  expected solutions into this repository.
