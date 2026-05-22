# Case Catalog

Source: `fixtures/agent-matrix-comprehensive.json`, `fixtures/prompt-suites/rust-skills-expanded.json`

## Summary

- Total cases: 42
- Categories: answer-quality=23, artifact-generation=7, review-debugging=7, code-generation=5
- Difficulties: medium=16, hard=19, expert=7

## Tags

| Tag | Count |
|-----|-------|
| answer | 23 |
| unsafe | 12 |
| api-design | 11 |
| concurrency | 11 |
| review | 11 |
| error-handling | 10 |
| async | 8 |
| artifact | 7 |
| debugging | 7 |
| ffi | 6 |
| ownership | 6 |
| codegen | 5 |
| performance | 5 |
| embedded | 4 |
| no-std | 4 |
| web | 4 |
| borrowing | 3 |
| cli | 3 |
| operations | 3 |
| parser | 3 |
| resource-management | 3 |
| lifetime | 2 |
| memory-safety | 2 |
| service-design | 2 |
| traits | 2 |
| benchmarking | 1 |
| domain-model | 1 |
| iterator | 1 |
| quick | 1 |
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

## code-generation

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| codegen-owned-index | medium | codegen, ownership, borrowing | cargo test --quiet |
| codegen-duration-parser | medium | codegen, parser, error-handling | cargo test --quiet |
| codegen-cli-args | medium | codegen, cli, error-handling | cargo test --quiet |
| codegen-state-machine | hard | codegen, type-state, domain-model | cargo test --quiet |
| codegen-no-std-ring-buffer | hard | codegen, embedded, no-std, resource-management | cargo test --quiet |
