# Task 050 — Deterministic candidate ranking

## Goal

Create a provider-neutral, explainable ranking engine that reduces the initial AI suggestion order
from a product decision to one input signal among verified evidence.

## Allowed files

- `packages/vocabulary/src/candidate-ranking.ts`
- `packages/vocabulary/src/candidate-ranking.test.ts`
- `packages/vocabulary/src/index.ts`
- `docs/adr/050-deterministic-candidate-ranking.md`
- `tasks/050-deterministic-candidate-ranking.md`

## Acceptance criteria

- Ranking is deterministic for identical inputs and policy.
- Every score is decomposed into named contributions.
- Verified lexical candidates outrank unavailable candidates under the default policy.
- Learner-requested candidates and topic relevance can increase priority.
- Mastered and recently practiced candidates can be deprioritized.
- Frequency and level evidence are normalized and provider-neutral.
- Out-of-range evidence is clamped safely.
- Ties use stable candidate IDs rather than input order or randomness.
- Inputs remain immutable.
- No React, Next.js, AI model, database, or concrete provider dependency is added.
- Existing candidate pipeline behavior remains unchanged.

## Verification

- Focused candidate-ranking unit tests.
- Vocabulary package typecheck, lint, and build.
- Repository quality gates before commit.

## Rollback

Remove the ranking module, export, tests, ADR, and this task document.
