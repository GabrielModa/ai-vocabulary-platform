# Task 136 — Retry only missing study examples

## Goal

Make local study-example generation resilient without weakening lexical or pedagogical validation.

## Allowed files

- `packages/ai/src/ollama-examples.ts`
- `packages/ai/src/ollama-examples.test.ts`
- `apps/web/app/api/vocabulary/generate/generated-example-enrichment.test.ts`
- `docs/decisions/ADR-0054-retry-only-missing-study-examples.md`
- `tasks/136-retry-missing-study-examples.md`

## Acceptance criteria

- Valid examples from a mixed-quality response are retained.
- Only unresolved candidates are included in the next Ollama request.
- Retries are bounded and do not regenerate accepted examples.
- A partially successful batch remains usable after retries are exhausted.
- Completely invalid output still fails honestly after the retry limit.
- Generated examples remain sense-bound, structurally validated, and provisional.
- Tests cover selective retry, exhausted partial success, and complete failure.
