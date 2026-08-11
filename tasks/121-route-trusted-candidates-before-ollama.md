# Task 121 — Route trusted candidates before Ollama

## Status

Approved

## Goal

Use the trusted local topic catalog as the first candidate source and call Ollama only when the
catalog cannot supply the current deficit.

## Acceptance criteria

- Convert fact-free local candidates into the existing generation input without presenting
  placeholders to learners.
- Avoid Ollama when the local catalog supplies candidates for the current attempt.
- Pass exclusions into both local and Ollama candidate sources.
- Fall back to Ollama for unsupported or exhausted topics.
- Preserve the existing lexical enrichment and quality gates after candidate suggestion.
- Cover the routing behavior with tests.

## Allowed files

- `apps/web/app/api/vocabulary/generate/candidate-suggestion.ts`
- `apps/web/app/api/vocabulary/generate/candidate-suggestion.test.ts`
- `apps/web/app/api/vocabulary/generate/route.ts`
- `docs/decisions/ADR-0046-route-trusted-candidates-before-ollama.md`
- `tasks/121-route-trusted-candidates-before-ollama.md`

## Verification

Run the targeted routing tests, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in
that order.
