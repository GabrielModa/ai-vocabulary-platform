# Task 058 — Deterministic pedagogical readiness

## Goal

Decide whether a structurally valid exercise has enough deterministic contextual evidence to be
published or should be routed to fallback.

## Acceptance criteria

- Structural readiness is a mandatory precondition.
- Structurally invalid exercises return `needs-fallback`.
- At least three lexical context tokens remain outside the gap.
- The answer cannot dominate the source sentence.
- Options cannot already be visible outside the gap.
- Matching is Unicode-normalized and case-insensitive.
- All discovered readiness issues are returned.
- Every issue contains measurable evidence.
- Passing exercises use `pedagogically-ready`.
- Semantic uniqueness remains explicitly not proven.
- Input is not mutated.
- No AI, React, database, provider lookup, network, randomness, or dependency is added.

## Verification

- Focused pedagogical-readiness tests.
- Vocabulary package typecheck, lint, and build.
- Full repository gates before commit.

## Next checkpoint

Define the AI fallback policy and its strict input/output contract for only the exercises marked
`needs-fallback`.
