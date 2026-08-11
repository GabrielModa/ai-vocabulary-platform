# Task 117 — Instrument vocabulary generation pipeline

## Status

Approved

## Goal

Measure candidate suggestion, enrichment, replacement, and total generation time through the
privacy-safe vocabulary metric contract.

## Acceptance criteria

- Measure each candidate-suggestion and enrichment attempt independently.
- Emit one replacement summary with exact or partial fulfillment counts.
- Use an injectable monotonic clock for deterministic tests.
- Use an optional metric sink so instrumentation cannot require a provider.
- Never include topic, candidate terms, definitions, examples, or provider payloads.
- Preserve deficit-only replacement behavior and retry limits.

## Allowed files

- `apps/web/package.json`
- `apps/web/app/api/vocabulary/generate/replacement-generation.ts`
- `apps/web/app/api/vocabulary/generate/replacement-generation.test.ts`
- `packages/observability/src/vocabulary-generation-metrics.ts`
- `packages/observability/src/vocabulary-generation-metrics.test.ts`
- `pnpm-lock.yaml`
- `docs/decisions/ADR-0042-instrument-vocabulary-generation-pipeline.md`
- `tasks/117-instrument-vocabulary-generation-pipeline.md`

## Verification

Run the replacement and metric tests first, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and
`pnpm build` in that order.
