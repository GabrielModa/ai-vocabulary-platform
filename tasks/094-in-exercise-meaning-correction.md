# Task 094 — In-exercise Meaning Correction

## Objective

Let learners correct an automatically selected meaning during study without mutating immutable
exercise snapshots.

## Acceptance criteria

- `Wrong meaning?` appears after feedback only when multiple trusted senses exist.
- Alternative choices are restricted to trusted lexical senses.
- The current attempt becomes unscored.
- A previously awarded point is removed when necessary.
- The current exercise and session snapshot remain unchanged.
- The selected sense is stored as a normalized browser-local preference.
- Future generated candidates use the stored sense when still valid.
- Stale preferences fall back safely to automatic resolution.
- Result scoring excludes meaning-corrected questions.
- Focused tests, typecheck, lint, build, MVP verification, and formatting pass.
