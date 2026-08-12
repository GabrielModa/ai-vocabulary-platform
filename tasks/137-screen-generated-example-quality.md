# Task 137 — Screen generated example quality

## Goal

Apply deterministic pedagogical checks to each sense-bound generated example.

## Acceptance criteria

- Assess examples independently rather than trusting the model batch.
- Enforce level-sensitive sentence-length ceilings without claiming CEFR certification.
- Reject fragments, repeated target terms, gaps, URLs, control characters, and meta-definitions.
- Require enough context outside the target term.
- Return measurable reason codes and an explicit quality score.
- Retry only examples rejected by the quality screen.
- Preserve valid partial output after bounded retries.

## Allowed files

- packages/ai/src/example-quality.ts
- packages/ai/src/example-quality.test.ts
- packages/ai/src/ollama-examples.ts
- packages/ai/src/ollama-examples.test.ts
- packages/ai/src/index.ts
- docs/decisions/ADR-0055-deterministic-generated-example-screen.md
- docs/PROJECT_CONTEXT_PROMPT.md
- tasks/137-screen-generated-example-quality.md
