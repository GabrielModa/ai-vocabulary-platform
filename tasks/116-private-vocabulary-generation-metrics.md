# Task 116 — Privacy-safe vocabulary generation metrics

## Status

Approved

## Goal

Define a bounded telemetry contract for lexical generation performance and quality without recording
learner text, generated words, examples, definitions, or arbitrary provider values.

## Acceptance criteria

- Normalize generation stage and outcome to fixed, documented enums.
- Record only bounded counts, integer duration, attempt count, and cache state.
- Clamp invalid numeric values to safe non-negative integers.
- Drop arbitrary fields through the existing telemetry allowlist.
- Keep exporter failure isolated from generation work.

## Allowed files

- `packages/observability/src/index.ts`
- `packages/observability/src/observability.test.ts`
- `packages/observability/src/telemetry.ts`
- `packages/observability/src/vocabulary-generation-metrics.ts`
- `packages/observability/src/vocabulary-generation-metrics.test.ts`
- `packages/observability/README.md`
- `docs/OBSERVABILITY.md`
- `docs/decisions/ADR-0041-private-vocabulary-generation-metrics.md`
- `tasks/116-private-vocabulary-generation-metrics.md`

## Verification

Run the observability tests first, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
in that order.
