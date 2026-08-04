# Task 057 — Structural exercise readiness

## Goal

Provide one deterministic runtime decision for whether a composed exercise is structurally ready for
downstream use.

## Acceptance criteria

- Validation is pure and deterministic.
- Exactly one gap is required.
- Exactly four unique, non-empty options are required.
- The answer appears exactly once among the options.
- Exactly three unique distractor candidate references are required.
- Candidate, sense, example, and exercise IDs are non-empty.
- Exercise ID matches the shared deterministic ID builder.
- Lexical and example provenance are complete.
- Composition strategy is verified.
- All discovered issues are returned in one result.
- Semantic uniqueness remains explicitly not evaluated.
- Input is not mutated.
- No AI, React, database, network, randomness, or dependency is added.

## Verification

- Focused validator and composer tests.
- Vocabulary package typecheck, lint, and build.
- Full repository gates before commit.

## Next checkpoint

Add sentence-level unique-answer validation and distinguish structural readiness from pedagogical
readiness.
