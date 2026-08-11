# Task 112 — Exact count and deficit-only replacement

## Status

Approved

## Goal

Deliver the requested number of lexically usable vocabulary candidates when possible without
regenerating candidates that already passed validation.

## Acceptance criteria

- Preserve usable candidates across attempts.
- Ask the local AI only for the remaining deficit.
- Exclude every previously seen term from later suggestions.
- Stop after three bounded attempts.
- Return an explicit exact or partial fulfillment result.
- Never represent a partial result as complete.
- Cover exact replacement, deduplication, and exhausted-attempt behavior with tests.

## Allowed files

- `packages/ai/src/ollama-vocabulary.ts`
- `packages/ai/src/ollama-vocabulary.test.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/replacement-generation.ts`
- `apps/web/app/api/vocabulary/generate/replacement-generation.test.ts`
- `apps/web/app/api/vocabulary/generate/route.ts`
- `apps/web/app/api/vocabulary/generate/response-contract.test.ts`
- `apps/web/app/api/vocabulary/generate/authenticated-generation.test.ts`
- `apps/web/app/api/vocabulary/generate/contextual-lexical-enrichment.test.ts`
- `docs/decisions/ADR-0037-deficit-only-vocabulary-replacement.md`
- `tasks/112-exact-count-deficit-replacement.md`

## Verification

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in that order.
