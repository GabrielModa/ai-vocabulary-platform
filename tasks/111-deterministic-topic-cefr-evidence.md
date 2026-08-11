# Task 111 — Deterministic topic and CEFR evidence

## Goal

Rank candidates with explainable topic evidence and a clearly provisional, versioned frequency-based
CEFR estimate.

## Allowed files

- `packages/vocabulary/src/candidate-learning-evidence.ts`
- `packages/vocabulary/src/candidate-learning-evidence.test.ts`
- `packages/vocabulary/src/index.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `apps/web/app/api/vocabulary/generate/route.ts`
- `docs/decisions/ADR-0036-deterministic-topic-cefr-evidence.md`
- `tasks/111-deterministic-topic-cefr-evidence.md`

## Acceptance criteria

- Topic relevance uses normalized verified definitions and examples, not a model confidence claim.
- AI suggestion provenance supplies only a weak fallback score when lexical context has no match.
- Frequency-based CEFR is explicitly `provisional` and versioned.
- Missing frequency evidence produces no silent CEFR estimate.
- Ranking receives topic relevance and level distance without changing verified lexical facts.

## Verification

- Domain evidence tests.
- Lexical enrichment ranking tests.
- Repository quality gates.
