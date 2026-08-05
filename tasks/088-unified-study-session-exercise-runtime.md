# Task 088 — Unified Study-Session Exercise Runtime

## Objective

Centralize public exercise projection and answer evaluation for all persisted study-session exercise
kinds.

## Acceptance criteria

- Cloze and definition-choice use the same runtime adapter.
- Public serialization never exposes the persisted answer.
- Exactly four persisted options are preserved.
- Selected options are normalized before evaluation.
- Options outside the persisted exercise are rejected.
- Correctness and correct-answer output remain unchanged.
- Response and answer HTTP handlers delegate exercise-specific behavior.
- No database, generation, draft, or UI behavior changes.
- Focused tests, web typecheck, lint, build, and formatting pass.
