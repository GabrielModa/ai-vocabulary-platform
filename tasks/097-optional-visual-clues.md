# Task 097 — Optional visual clues

## Goal

Let learners disable local image generation so the complete study flow can be tested and used
without waiting for the image worker.

## Allowed files

- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/page.test.tsx`
- `apps/web/app/styles.css`
- `apps/web/app/visual-clue-preferences.ts`
- `apps/web/app/visual-clue-preferences.test.ts`
- `docs/adr/097-optional-visual-clues.md`
- `tasks/097-optional-visual-clues.md`

## Acceptance criteria

- Visual clues remain enabled by default.
- The learner can disable visual clues before generating a set and during training.
- The preference is stored locally and restored safely.
- Disabled visual clues cause no image enqueue, polling, or prefetch request.
- Disabling during training cancels active polling by unmounting the image component.
- Exercises, audio, answers, feedback, navigation, and progress remain available.
- The interface explains that the session is running without visual clues and shows no image
  spinner.
- Unit and UI regression tests cover the preference and request suppression.
- Documentation and all repository quality gates pass.

## Rollback

Remove the preference module and controls, then render `PracticeImage` and prefetch images
unconditionally again.
