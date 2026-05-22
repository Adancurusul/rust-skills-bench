# Case Catalog

Source: `fixtures/agent-matrix-comprehensive.json`

## Summary

- Total cases: 20
- Categories: answer-quality=8, artifact-generation=4, review-debugging=3, code-generation=5
- Difficulties: medium=10, hard=8, expert=2

## Tags

| Tag | Count |
|-----|-------|
| answer | 8 |
| error-handling | 6 |
| api-design | 5 |
| codegen | 5 |
| concurrency | 5 |
| review | 5 |
| artifact | 4 |
| unsafe | 4 |
| async | 3 |
| debugging | 3 |
| ownership | 3 |
| cli | 2 |
| embedded | 2 |
| ffi | 2 |
| no-std | 2 |
| performance | 2 |
| resource-management | 2 |
| benchmarking | 1 |
| borrowing | 1 |
| domain-model | 1 |
| operations | 1 |
| parser | 1 |
| service-design | 1 |
| traits | 1 |
| type-state | 1 |
| web | 1 |

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

## artifact-generation

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| artifact-review-checklist | medium | artifact, review, ownership, concurrency, unsafe, error-handling | text/file expectations |
| artifact-api-adr | medium | artifact, api-design, error-handling | text/file expectations |
| artifact-async-migration-plan | hard | artifact, async, concurrency, operations | text/file expectations |
| artifact-unsafe-safety-contract | hard | artifact, unsafe, ffi, review | text/file expectations |

## review-debugging

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| review-debug-async-lock-await | hard | review, async, concurrency, debugging | text/file expectations |
| review-debug-error-swallowing | medium | review, cli, error-handling, debugging | text/file expectations |
| review-debug-unsafe-transmute | expert | review, unsafe, performance, debugging | text/file expectations |

## code-generation

| ID | Difficulty | Tags | Verification |
|----|------------|------|--------------|
| codegen-owned-index | medium | codegen, ownership, borrowing | cargo test --quiet |
| codegen-duration-parser | medium | codegen, parser, error-handling | cargo test --quiet |
| codegen-cli-args | medium | codegen, cli, error-handling | cargo test --quiet |
| codegen-state-machine | hard | codegen, type-state, domain-model | cargo test --quiet |
| codegen-no-std-ring-buffer | hard | codegen, embedded, no-std, resource-management | cargo test --quiet |
