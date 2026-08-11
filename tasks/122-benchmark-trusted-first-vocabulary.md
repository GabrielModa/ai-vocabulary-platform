# Task 122 — Benchmark trusted-first vocabulary generation

## Status

Approved

## Goal

Measure the production candidate routing path after introducing trusted local candidates.

## Acceptance criteria

- Run the benchmark through the same trusted-first adapter used by the web route.
- Preserve Ollama fallback in the benchmark for unsupported or exhausted topics.
- Record a real smoke benchmark for covered common topics.
- Compare the result with the pre-routing baseline without claiming unmeasured gains.

## Allowed files

- `apps/web/scripts/run-vocabulary-benchmark.ts`
- `docs/performance/vocabulary-generation-benchmark.md`
- `tasks/122-benchmark-trusted-first-vocabulary.md`

## Verification

Run `pnpm benchmark:vocabulary`, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
in that order.
