# Task 103 — Local adaptive review

## Goal

Project immutable local session history through the versioned learning engine and let the learner
start a deterministic adaptive review from the capture screen.

## Allowed files

- `apps/web/app/adaptive-local-review.ts`
- `apps/web/app/adaptive-local-review.test.ts`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/page.test.tsx`
- `apps/web/app/styles.css`
- `packages/vocabulary/src/learning-engine.ts`
- `docs/adr/103-local-adaptive-review.md`
- `tasks/103-local-adaptive-review.md`

## Acceptance criteria

- Completed attempts become stable, deduplicated v1 learning events.
- Voided attempts remain in audit history but never become mastery evidence.
- Knowledge identity prefers verified sense ID and otherwise uses normalized term and part of
  speech.
- Projections are rebuilt from immutable history and then passed to the adaptive planner.
- The capture screen reports due, new, and early-review counts without claiming global mastery.
- The learner can start the planned review without Ollama or image generation.
- Planned candidates retain their verified exercise content and broader safe distractor pool.
- Empty or storage-unavailable history leaves normal capture unaffected.
- Unit and UI tests cover event mapping, replay, void exclusion, deterministic selection and launch.
- Documentation and all repository quality gates pass.

## Rollback

Remove the local adapter and adaptive-review action. Historical sessions and domain algorithms
remain independently valid.
