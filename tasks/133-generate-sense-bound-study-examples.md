# Task 133 — Generate sense-bound study examples

## Goal

Replace the empty Study-mode example placeholder with a fast, batched local-AI fallback while
preserving the distinction between verified corpus evidence and generated learning content.

## Allowed files

- `tasks/133-generate-sense-bound-study-examples.md`
- `packages/ai/src/index.ts`
- `packages/ai/src/ollama-examples.ts`
- `packages/ai/src/ollama-examples.test.ts`
- `apps/web/app/api/vocabulary/generate/generated-example-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/generated-example-enrichment.test.ts`
- `apps/web/app/api/vocabulary/generate/route.ts`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/lexical-review.ts`
- `apps/web/src/generated-example-study-fallback.test.ts`
- `docs/decisions/0021-generated-study-example-fallback.md`

## Acceptance criteria

- Generate missing examples in one bounded Ollama request after lexical sense selection.
- Bind every request to an opaque candidate id, verified sense definition, topic, part of speech,
  and CEFR level.
- Reject malformed, duplicate, missing, unrelated, or term-omitting output.
- Never overwrite verified corpus examples.
- Mark accepted local-AI examples as generated and provisional, never verified.
- Keep generation usable when Ollama example enrichment fails.
- Identify generated examples in Study mode.
- Keep the fast trusted candidate-selection path unchanged.
- Add unit and integration-oriented tests and record the provenance decision.

## Verification

- Directed Vitest tests for AI generation and web enrichment.
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
