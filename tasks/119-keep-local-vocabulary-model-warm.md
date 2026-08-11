# Task 119 — Keep local vocabulary model warm

## Status

Approved

## Goal

Reduce repeated Ollama cold-start latency without changing generation quality or validation.

## Acceptance criteria

- Request a bounded 30-minute model residency for vocabulary generation.
- Preserve model, format, temperature, token budget, prompts, retries, and schemas.
- Keep the existing verified in-memory response cache.
- Cover the Ollama request contract with a test.

## Allowed files

- `packages/ai/src/ollama-vocabulary.ts`
- `packages/ai/src/ollama-vocabulary.test.ts`
- `docs/decisions/ADR-0044-keep-local-vocabulary-model-warm.md`
- `tasks/119-keep-local-vocabulary-model-warm.md`

## Verification

Run the Ollama vocabulary tests, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
in that order.
