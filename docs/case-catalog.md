# Case Catalog

Source: `fixtures/agent-matrix-comprehensive.json`, `fixtures/prompt-suites/rust-skills-expanded.json`, `fixtures/prompt-suites/rust-public-eval-inspired.json`

## Summary

- Total cases: 66
- Categories: answer-quality=23, artifact-generation=10, review-debugging=10, code-generation=5, compiler-diagnostics=6, api-evolution=3, repository-issue=3, test-generation=2, quality-gates=2, performance-eval=1, tooling-diagnostics=1
- Difficulties: medium=24, hard=30, expert=12

## Tags

| Tag | Count |
|-----|-------|
| answer | 41 |
| rust-eval | 24 |
| unsafe | 16 |
| api-design | 14 |
| concurrency | 14 |
| error-handling | 14 |
| review | 14 |
| async | 11 |
| artifact | 10 |
| ownership | 10 |
| testing | 8 |
| compiler-diagnostics | 7 |
| debugging | 7 |
| ffi | 6 |
| performance | 6 |
| codegen | 5 |
| memory-safety | 5 |
| no-std | 5 |
| api-evolution | 4 |
| borrowing | 4 |
| cargo | 4 |
| embedded | 4 |
| parser | 4 |
| repository-issue | 4 |
| web | 4 |
| cli | 3 |
| lifetime | 3 |
| operations | 3 |
| quality-gates | 3 |
| resource-management | 3 |
| traits | 3 |
| benchmarking | 2 |
| edge-cases | 2 |
| msrv | 2 |
| quick | 2 |
| service-design | 2 |
| test-generation | 2 |
| documentation | 1 |
| domain-model | 1 |
| iterator | 1 |
| macros | 1 |
| performance-eval | 1 |
| semver | 1 |
| tooling-diagnostics | 1 |
| type-state | 1 |

## answer-quality

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| answer-ownership-api-e0382 | medium | answer, ownership, api-design | text/file expectations |
| answer-async-backpressure-cancel | hard | answer, async, concurrency, service-design | text/file expectations |
| answer-unsafe-ffi-slice-contract | expert | answer, unsafe, ffi, api-design | text/file expectations |
| answer-library-error-boundary | medium | answer, error-handling, api-design | text/file expectations |
| answer-performance-allocation-plan | hard | answer, performance, benchmarking | text/file expectations |
| answer-trait-object-safety | hard | answer, traits, api-design | text/file expectations |
| answer-embedded-no-std-logging | medium | answer, embedded, no-std, resource-management | text/file expectations |
| answer-web-shared-state-rc | medium | answer, web, concurrency | text/file expectations |
| answer-ownership-mut-borrow-boundary | medium | answer, ownership, api-design, borrowing | text/file expectations |
| answer-ownership-closure-move-iterator | medium | answer, ownership, iterator, borrowing | text/file expectations |
| answer-lifetime-return-reference | hard | answer, ownership, lifetime, api-design | text/file expectations |
| answer-send-sync-spawn-state | hard | answer, async, concurrency, web | text/file expectations |
| answer-blocking-in-async-runtime | hard | answer, async, concurrency, performance, web | text/file expectations |
| answer-channel-backpressure-policy | hard | answer, async, concurrency, service-design | text/file expectations |
| answer-cli-exit-code-quick | medium | answer, cli, error-handling, quick | text/file expectations |
| answer-error-source-context-chain | medium | answer, error-handling, api-design, operations | text/file expectations |
| answer-unsafe-repr-c-layout | expert | answer, unsafe, ffi, api-design | text/file expectations |
| answer-unsafe-maybeuninit-buffer | expert | answer, unsafe, ffi, memory-safety | text/file expectations |
| answer-unsafe-cstring-lifetime | hard | answer, unsafe, ffi, lifetime | text/file expectations |
| answer-unsafe-packed-alignment | expert | answer, unsafe, parser, memory-safety | text/file expectations |
| answer-no-std-panic-alloc-policy | hard | answer, embedded, no-std, resource-management | text/file expectations |
| answer-embedded-isr-logging | hard | answer, embedded, no-std, concurrency | text/file expectations |
| answer-trait-object-plugin-abi | hard | answer, traits, api-design | text/file expectations |

## artifact-generation

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| artifact-review-checklist | medium | artifact, review, ownership, concurrency, unsafe, error-handling | text/file expectations |
| artifact-api-adr | medium | artifact, api-design, error-handling | text/file expectations |
| artifact-async-migration-plan | hard | artifact, async, concurrency, operations | text/file expectations |
| artifact-unsafe-safety-contract | hard | artifact, unsafe, ffi, review | text/file expectations |
| artifact-release-quality-gates | medium | artifact, review, unsafe, error-handling | text/file expectations |
| artifact-async-shutdown-runbook | hard | artifact, async, concurrency, operations | text/file expectations |
| artifact-ffi-safety-template | hard | artifact, unsafe, ffi, review | text/file expectations |
| artifact-compiler-error-playbook | medium | artifact, compiler-diagnostics, ownership, error-handling, rust-eval | text/file expectations |
| artifact-api-evolution-checklist | hard | artifact, api-evolution, msrv, testing, rust-eval | text/file expectations |
| artifact-repo-issue-reproduction | hard | artifact, repository-issue, testing, cargo, rust-eval | text/file expectations |

## review-debugging

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| review-debug-async-lock-await | hard | review, async, concurrency, debugging | text/file expectations |
| review-debug-error-swallowing | medium | review, cli, error-handling, debugging | text/file expectations |
| review-debug-unsafe-transmute | expert | review, unsafe, performance, debugging | text/file expectations |
| review-debug-blocking-async-handler | hard | review, async, web, performance, debugging | text/file expectations |
| review-debug-static-mut-cache | expert | review, unsafe, concurrency, debugging | text/file expectations |
| review-debug-transmute-endian-expanded | expert | review, unsafe, parser, performance, debugging | text/file expectations |
| review-debug-unwrap-library | medium | review, error-handling, api-design, debugging | text/file expectations |
| review-unsafe-send-sync-impl | expert | review, unsafe, concurrency, memory-safety, rust-eval | text/file expectations |
| review-pin-self-referential | expert | review, async, unsafe, memory-safety, rust-eval | text/file expectations |
| review-miri-ub-triage | expert | review, unsafe, testing, memory-safety, rust-eval | text/file expectations |

## code-generation

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| codegen-owned-index | medium | codegen, ownership, borrowing | cargo test --quiet |
| codegen-duration-parser | medium | codegen, parser, error-handling | cargo test --quiet |
| codegen-cli-args | medium | codegen, cli, error-handling | cargo test --quiet |
| codegen-state-machine | hard | codegen, type-state, domain-model | cargo test --quiet |
| codegen-no-std-ring-buffer | hard | codegen, embedded, no-std, resource-management | cargo test --quiet |

## compiler-diagnostics

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| compiler-e0382-moved-builder | medium | answer, compiler-diagnostics, ownership, api-design, rust-eval | text/file expectations |
| compiler-e0502-split-borrows | medium | answer, compiler-diagnostics, ownership, borrowing, rust-eval | text/file expectations |
| compiler-e0716-temporary-drop | medium | answer, compiler-diagnostics, lifetime, ownership, rust-eval | text/file expectations |
| compiler-e0277-send-bound-rc | hard | answer, compiler-diagnostics, async, concurrency, rust-eval | text/file expectations |
| compiler-e0282-type-inference-channel | medium | answer, compiler-diagnostics, async, error-handling, rust-eval | text/file expectations |
| compiler-e0308-result-error-boundary | medium | answer, compiler-diagnostics, error-handling, api-design, rust-eval | text/file expectations |

## api-evolution

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| api-evolution-msrv-stabilization | hard | answer, api-evolution, msrv, semver, rust-eval, quick | text/file expectations |
| api-evolution-deprecated-crate-method | hard | answer, api-evolution, error-handling, testing, rust-eval | text/file expectations |
| api-evolution-behavior-change | expert | answer, api-evolution, testing, edge-cases, rust-eval | text/file expectations |

## repository-issue

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| repo-feature-resolver-workspace | hard | answer, repository-issue, cargo, no-std, rust-eval | text/file expectations |
| repo-orphan-rule-newtype | hard | answer, repository-issue, traits, api-design, rust-eval | text/file expectations |
| repo-test-reproduction-first | hard | answer, repository-issue, testing, cargo, rust-eval | text/file expectations |

## test-generation

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| answer-test-generation-property-boundaries | hard | answer, test-generation, parser, edge-cases, rust-eval | text/file expectations |
| answer-loom-concurrency-model | expert | answer, test-generation, concurrency, performance, rust-eval | text/file expectations |

## quality-gates

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| answer-cargo-clippy-quality-gates | medium | answer, quality-gates, cargo, unsafe, rust-eval | text/file expectations |
| answer-rustdoc-public-contract | medium | answer, quality-gates, documentation, testing, rust-eval | text/file expectations |

## performance-eval

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| answer-performance-criterion-noise | hard | answer, performance-eval, benchmarking, quality-gates, rust-eval | text/file expectations |

## tooling-diagnostics

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| answer-proc-macro-diagnostics | hard | answer, tooling-diagnostics, macros, testing, rust-eval | text/file expectations |
