# Task 151 — Balance distractors across a learning set

Stop high-quality distractors from becoming a repeated fixed trio across consecutive questions.

## Allowed files

- `packages/vocabulary/src/distractor-selection.ts`
- `packages/vocabulary/src/distractor-selection.test.ts`
- `packages/vocabulary/src/exercise-composer.ts`
- `packages/vocabulary/src/definition-choice-distractor-selector.ts`
- `packages/vocabulary/src/definition-choice-distractor-selector.test.ts`
- `packages/vocabulary/src/definition-choice-publisher.ts`
- `apps/web/app/api/vocabulary/generate/pipeline-adapter.ts`
- `apps/web/app/api/vocabulary/generate/pipeline-adapter.test.ts`
- `apps/web/src/reviewed-definition-choice-publication.ts`
- `apps/web/src/reviewed-definition-choice-publication.test.ts`
- `tasks/151-balance-distractors-across-set.md`

## Acceptance criteria

- Cloze and definition-choice exercises coordinate distractor selection across the complete set.
- Compatible candidates used fewer times are preferred before frequency and semantic tie-breakers.
- Every question still has three unique, same-part-of-speech, verified distractors.
- Selection remains deterministic and does not mutate inputs.
- Rejected exercises do not consume distractor usage.
- Set-level tests prove that alternatives rotate and usage remains balanced.
- Repository quality gates pass.

## Product decision

Distractor credibility is a per-question constraint; distractor diversity is a set-level constraint.
The orchestrator tracks usage locally while domain selectors remain deterministic through an
explicit read-only usage input.
