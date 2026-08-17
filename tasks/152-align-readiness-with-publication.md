# Task 152 — Align readiness with actual publication

Remove the contradiction where review reports a fully ready set but session creation can publish
only a subset of its exercises.

## Allowed files

- `apps/web/src/reviewed-definition-choice-publication.ts`
- `apps/web/src/reviewed-definition-choice-publication.test.ts`
- `apps/web/app/api/vocabulary/generate/learning-set-readiness.ts`
- `apps/web/app/api/vocabulary/generate/learning-set-readiness.test.ts`
- `apps/web/app/api/vocabulary/generate/authenticated-generation.ts`
- `apps/web/app/api/vocabulary/generate/authenticated-generation.test.ts`
- `tasks/152-align-readiness-with-publication.md`

## Acceptance criteria

- Supplemental candidates with a verified context-selected sense can supply distractors.
- Supplemental candidates with unresolved ambiguity remain excluded.
- Final API readiness uses the actual set of candidates that can publish through cloze or definition
  choice.
- “Ready” is never reported solely because four definitions exist.
- A partially publishable set reports the exact count before the learner starts training.
- Existing draft security and learner-selected sense validation remain unchanged.
- Repository quality gates pass.

## Product decision

Lexical readiness and exercise publishability are different facts. The UI-facing final readiness is
computed only after the hidden verified distractor reserve exists and the same publication strategy
used at session creation has been previewed.
