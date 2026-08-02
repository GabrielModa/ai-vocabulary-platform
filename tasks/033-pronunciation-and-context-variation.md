# Task 033 — Pronunciation and context variation

## Goal

Deepen feedback after retrieval without leaking answers before the attempt.

## Allowed files

- `packages/ai/src/ollama-vocabulary.ts`
- `packages/ai/src/ollama-vocabulary.test.ts`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/styles.css`
- `tasks/033-pronunciation-and-context-variation.md`

## Acceptance criteria

- Local AI is asked for IPA, a simple pronunciation tip, and three varied contexts.
- Optional enriched fields remain backward compatible with existing responses.
- Pronunciation guidance appears after answering and in the final review.
- Three contexts appear in expandable final word details.
