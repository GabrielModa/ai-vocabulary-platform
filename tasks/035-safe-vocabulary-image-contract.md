# Task 035 — Safe vocabulary image contract

## Goal

Create the safety boundary for a future local image provider without coupling image failure to text
generation.

## Allowed files

- `packages/ai/src/index.ts`
- `packages/ai/src/safe-vocabulary-image.ts`
- `packages/ai/src/safe-vocabulary-image.test.ts`
- `tasks/035-safe-vocabulary-image-contract.md`

## Acceptance criteria

- Raw user text cannot become an unrestricted image prompt.
- Prompts require educational, text-free, age-appropriate illustrations.
- Images are accepted only with explicit local safety-check metadata.
- Invalid or unchecked output fails closed.
- The contract remains independent of any single image model.
