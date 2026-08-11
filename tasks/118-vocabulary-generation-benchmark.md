# Task 118 — Vocabulary generation benchmark

## Status

Approved

## Goal

Run a reproducible, content-free benchmark summary across representative topic and CEFR cases.

## Acceptance criteria

- Aggregate p50 and p95 latency by bounded pipeline stage.
- Report exact-fulfillment rate, delivered/rejected counts, and attempts.
- Keep generated terms, definitions, examples, and prompts out of the report.
- Provide a small smoke matrix and an explicit extended matrix.
- Print JSON to stdout; do not write generated artifacts by default.
- Fail clearly when Ollama or lexical dependencies are unavailable.

## Allowed files

- `package.json`
- `apps/web/scripts/run-vocabulary-benchmark.ts`
- `apps/web/src/vocabulary-benchmark.ts`
- `apps/web/src/vocabulary-benchmark.test.ts`
- `docs/PERFORMANCE.md`
- `docs/decisions/ADR-0043-vocabulary-generation-benchmark.md`
- `tasks/118-vocabulary-generation-benchmark.md`

## Verification

Run the benchmark unit tests, a real smoke benchmark, then `pnpm lint`, `pnpm typecheck`,
`pnpm test`, and `pnpm build` in that order.
