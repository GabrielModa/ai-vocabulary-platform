# Task 081 — Definition Choice Composer

## Objective

Compose a deterministic definition-to-word exercise from resolved lexical knowledge.

## Acceptance criteria

- The target definition comes from the selected official lexical sense.
- Exactly three resolved distractors are required.
- Distractors share the target part of speech.
- Choices are unique by normalized label and knowledge ID.
- Stable IDs identify the exercise, options, and correct answer.
- Target provenance is retained.
- Results are immutable and deterministic.
- No API, UI, database, draft, or study-session behavior changes.
- Focused tests, typecheck, lint, build, and formatting pass.
