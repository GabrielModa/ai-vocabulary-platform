# Task 128 — Benchmark expanded topic coverage

## Status

Approved

## Goal

Prove that the five newly covered everyday topics pass through the production trusted-first, lexical
enrichment, validation, and deficit-replacement pipeline with bounded, content-free metrics.

## Acceptance criteria

- A reproducible `--coverage` benchmark includes family, shopping, home, environment, and money.
- The benchmark cases request six items at representative CEFR levels.
- Matrix selection is deterministic and unit-tested.
- A real local run records exact fulfillment, rejection, attempt, and latency totals without words.
- Ollama remains a deficit-only fallback.

## Allowed files

- `apps/web/scripts/run-vocabulary-benchmark.ts`
- `apps/web/src/vocabulary-benchmark-cases.ts`
- `apps/web/src/vocabulary-benchmark-cases.test.ts`
- `docs/performance/expanded-topic-coverage-benchmark.md`
- `tasks/128-benchmark-expanded-topic-coverage.md`

## Verification

Run the matrix unit test, `pnpm benchmark:vocabulary -- --coverage`, then `pnpm lint`,
`pnpm typecheck`, `pnpm test`, and `pnpm build` in order.
