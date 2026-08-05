# Task 077 — Contextual Sense Selector

## Objective

Create a constrained AI selection policy that chooses among official lexical senses.

## Acceptance criteria

- A single selectable sense is chosen without calling AI.
- Ambiguous candidates require a selector.
- The selector sees only context and allowed verified senses.
- An invented `senseId` is rejected.
- Extra lexical content in the response is rejected.
- Confidence is bounded between zero and one.
- Malformed output and provider failures return structured errors.
- No API, draft, UI, database, or session behavior changes.
- Focused tests, typecheck, lint, build, and formatting pass.
