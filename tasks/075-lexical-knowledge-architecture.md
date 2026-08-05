# Task 075 — Lexical Knowledge Architecture

## Objective

Establish the durable domain contract that separates lexical evidence, contextual sense selection,
and exercise capability planning.

## Acceptance criteria

- `WordKnowledge` is exported from `@vocabulary/domain-vocabulary`.
- The selected sense must exist in lexical evidence.
- Confidence is bounded between zero and one.
- Alternative senses and source evidence are retained.
- Selection records whether AI, a unique source match, or the learner made the decision.
- Exercise capabilities are represented independently from generated exercises.
- Provenance is retained and deduplicated.
- No existing generation, draft, API, or UI behavior changes.
- Focused tests, package typecheck, lint, and build pass.
