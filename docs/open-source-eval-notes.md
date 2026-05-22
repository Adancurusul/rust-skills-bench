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

Bench decisions derived from those patterns:

- Fixtures are plain JSON and product-neutral.
- Results are reproducible files under `results/`, with per-sample capsules.
- The runner supports built-in agents and configurable external engines.
- Dry runs validate evidence shape; real runs launch actual agent processes.
- Benchmark failures are measured outcomes. The fix path is changing the
  subject skills/runtime, not weakening tests after seeing scores.
