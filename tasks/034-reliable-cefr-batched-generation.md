# Task 034 — Reliable CEFR-batched generation

## Goal

Improve local generation reliability and calibrate both words and sentences to the selected CEFR
level.

## Allowed files

- `packages/ai/src/ollama-vocabulary.ts`
- `packages/ai/src/ollama-vocabulary.test.ts`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/styles.css`
- `tasks/034-reliable-cefr-batched-generation.md`

## Acceptance criteria

- Collections larger than eight items are generated in smaller batches.
- Invalid model output receives one automatic retry.
- Model temperature is low for more consistent JSON.
- Every CEFR level has explicit vocabulary and sentence-complexity guidance.
- Unreliable model-generated phonetic text is no longer requested or displayed.
- Meaning and each context have independent audio controls.
