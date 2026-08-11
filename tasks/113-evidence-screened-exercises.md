# Task 113 — Evidence-screened deterministic exercises

## Status

Approved

## Goal

Prevent the verified exercise pipeline from publishing options with detectable semantic overlap
while keeping the decision deterministic and provider-independent.

## Acceptance criteria

- Screen only selected, verified lexical senses.
- Reject definition overlap and direct cross-references between answer and distractors.
- Reject a distractor already present in the source context.
- Publish only exercises that pass the evidence screen.
- Describe the result as evidence-screened, never semantically proven.
- Keep composition and fallback deterministic.

## Allowed files

- `packages/vocabulary/src/semantic-uniqueness.ts`
- `packages/vocabulary/src/semantic-uniqueness.test.ts`
- `packages/vocabulary/src/exercise-pipeline.ts`
- `packages/vocabulary/src/exercise-pipeline.test.ts`
- `packages/vocabulary/src/index.ts`
- `apps/web/app/api/vocabulary/generate/response-contract.ts`
- `apps/web/app/api/vocabulary/generate/response-contract.test.ts`
- `apps/web/app/api/vocabulary/generate/authenticated-generation.test.ts`
- `docs/decisions/ADR-0038-evidence-screened-exercises.md`
- `tasks/113-evidence-screened-exercises.md`

## Verification

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in that order.
