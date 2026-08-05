# Task 082 — Definition Choice Distractor Selection

## Objective

Select compatible resolved lexical distractors for definition-choice exercises.

## Acceptance criteria

- The default result contains exactly three distractors.
- Distractors share the target part of speech.
- Target knowledge, duplicate lemmas, display forms, senses, definitions, and knowledge IDs are
  excluded.
- Matching context and frequency similarity influence deterministic ranking.
- Equal scores use stable knowledge ID ordering.
- Insufficient pools return a structured error with the compatible count.
- Results are immutable.
- No API, UI, database, draft, session, or AI behavior changes.
- Focused tests, typecheck, lint, build, and formatting pass.
