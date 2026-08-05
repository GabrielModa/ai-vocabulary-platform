# Task 079 — Runtime Contextual Sense Integration

## Objective

Use Ollama to resolve ambiguous enriched candidates automatically.

## Acceptance criteria

- Ollama receives only learner context, candidate identity, and allowed official senses.
- Temperature is zero.
- Valid selections update meaning, sense ID, provenance, and selection metadata.
- Existing verified and unavailable candidates are not sent to the selector.
- Invalid selector output preserves the provisional candidate.
- The generation route supplies topic and level context.
- Focused adapter, runtime, domain, route, typecheck, lint, build, and formatting checks pass.
