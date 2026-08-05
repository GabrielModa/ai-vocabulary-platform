# Task 084 — Persistent Definition Choice Mapping

## Objective

Map published definition-choice exercises into the persistent study-session exercise contract.

## Acceptance criteria

- Definition-choice exercises include candidate, knowledge, sense, choice, and publication identity.
- Exactly four options and choice IDs are persisted.
- The correct choice is mapped to the persisted answer.
- Lexical provenance is retained.
- Published exercise selections accept cloze and definition-choice as a discriminated union.
- Study-session snapshots support both exercise kinds.
- Existing cloze snapshot behavior remains compatible.
- No generation route, draft resolution, HTTP, database, or UI behavior changes.
- Focused tests, typecheck, lint, build, and formatting pass.
