# Task 110 — Lexical Quality Gate

## Goal

Score candidate and set quality using deterministic, explainable evidence before replacement or
session publication.

## Allowed files

- `packages/vocabulary/src/candidate-quality.ts`
- `packages/vocabulary/src/candidate-quality.test.ts`
- `packages/vocabulary/src/index.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `apps/web/app/api/vocabulary/generate/response-contract.ts`
- `apps/web/app/api/vocabulary/generate/response-contract.test.ts`
- `apps/web/app/api/vocabulary/generate/authenticated-generation.test.ts`
- `apps/web/app/api/vocabulary/generate/contextual-lexical-enrichment.test.ts`
- `apps/web/src/mvp-http-flow.test.ts`
- `apps/web/src/reviewed-study-session-flow.test.ts`
- `docs/decisions/ADR-0035-lexical-quality-gate.md`
- `tasks/110-lexical-quality-gate.md`

## Acceptance criteria

- Candidate quality reports lexical, exercise, example, frequency, and ambiguity dimensions.
- Decisions are `accept`, `review`, or `reject` with stable reason codes.
- Set quality reports requested coverage and decision counts without hiding shortfalls.
- Scores use verified evidence only and do not elevate generated placeholders.
- Generation responses expose the quality report without weakening existing contracts.

## Verification

- Domain unit tests for each quality decision and set aggregation.
- Enrichment and response contract tests.
- Repository quality gates.
