# Task 054 — Deterministic sense-bound cloze

## Goal

Construct a valid one-gap exercise from a confirmed lexical sense and a licensed example without
asking the language model to invent the sentence.

## Allowed files

- `packages/vocabulary/src/sense-bound-cloze.ts`
- `packages/vocabulary/src/sense-bound-cloze.test.ts`
- `packages/vocabulary/src/index.ts`
- `docs/adr/054-deterministic-sense-bound-cloze.md`
- `tasks/054-deterministic-sense-bound-cloze.md`

## Acceptance criteria

- A selected lexical sense is mandatory.
- The example must have the exact same `senseId`.
- Matching is case-insensitive and Unicode-normalized.
- Only a complete answer token is accepted.
- The answer must occur exactly once.
- The result contains exactly one gap.
- Exactly three distractors are required.
- Answer and distractors are non-empty and unique after normalization.
- Expected content failures are returned as typed results.
- Source sentence and provider record remain auditable.
- Inputs are not mutated.
- No AI, provider lookup, React, database, network call, or dependency is added.

## Verification

- Focused cloze-builder tests.
- Vocabulary package typecheck, lint, and build.
- Full repository gates before commit.

## Next checkpoint

Build a deterministic distractor selector from verified lexical candidates and part-of-speech
constraints. Only unresolved cases should reach an AI fallback.
