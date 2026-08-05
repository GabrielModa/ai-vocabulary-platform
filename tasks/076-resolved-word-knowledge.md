# Task 076 — Resolved Word Knowledge

## Objective

Bridge the current verified candidate pipeline to `WordKnowledge`.

## Acceptance criteria

- Unique verified senses resolve automatically.
- Learner-confirmed senses preserve learner resolution.
- Ambiguous candidates return `needs-review`.
- Sense-bound evidence is filtered to the selected sense.
- Exercise capabilities remain independent from generation.
- No API, draft, UI, or session behavior changes.
- Tests, typecheck, lint, build, and formatting pass.
