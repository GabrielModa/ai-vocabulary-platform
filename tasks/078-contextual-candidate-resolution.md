# Task 078 — Contextual Candidate Resolution

## Objective

Convert validated contextual sense decisions into verified learning candidates.

## Acceptance criteria

- A single official sense resolves without calling AI.
- A valid AI selection creates a verified candidate.
- The selected sense retains official definition and provenance.
- AI resolution is recorded as `contextual-ai-selection`.
- Invalid or unavailable AI output remains reviewable.
- Missing lexical evidence is rejected.
- No API, UI, database, draft, or Ollama behavior changes.
- Focused tests, typecheck, lint, build, and formatting pass.
