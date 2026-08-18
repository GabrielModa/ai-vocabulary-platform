# Task 157 — Cross-question option diversity

## Status

Approved

## Goal

Prevent a study session from repeating almost the same distractor block across different questions,
even when every individual exercise is structurally valid.

## Acceptance criteria

- Distractor selection tracks prior candidate-pair co-occurrence across the session.
- Compatible candidates that have not repeatedly appeared together are preferred.
- Frequency proximity, part-of-speech compatibility, and balanced individual usage remain intact.
- The same input produces the same complete exercise set.
- A sufficiently deep pool produces varied option combinations rather than fixed wrong answers.
- Repository quality gates pass.

## Allowed files

- `packages/vocabulary/src/distractor-selection.ts`
- `packages/vocabulary/src/distractor-selection.test.ts`
- `packages/vocabulary/src/exercise-composer.ts`
- `apps/web/app/api/vocabulary/generate/pipeline-adapter.ts`
- `apps/web/app/api/vocabulary/generate/pipeline-adapter.test.ts`
- `docs/decisions/ADR-0054-cross-question-option-diversity.md`
- `tasks/157-cross-question-option-diversity.md`

## Product decision

Exercise validity is evaluated both within a question and across the session. Repeated option-set
templates are a pedagogical defect because they expose generation patterns instead of testing
meaning in context.
