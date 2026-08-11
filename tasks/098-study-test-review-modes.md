# Task 098 — Study and Test review modes

## Goal

Make passive study an explicit learner choice while keeping retrieval-first review as the default.

## Allowed files

- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/page.test.tsx`
- `apps/web/app/styles.css`
- `docs/adr/098-study-test-review-modes.md`
- `tasks/098-study-test-review-modes.md`

## Acceptance criteria

- Review starts in Test mode and does not expose meanings or examples.
- A labeled, keyboard-accessible mode control switches between Test and Study.
- Study mode shows the meaning, example, and available distinct contexts for each candidate.
- Meaning, example, and context content has granular audio controls.
- Returning to Test mode hides content that reveals answers.
- Sense confirmation remains available independently for ambiguous candidates.
- No lexical facts are synthesized or modified in the UI.
- UI tests cover both modes and repository quality gates pass.

## Rollback

Remove the mode control and study details, preserving the current retrieval-first review list.
