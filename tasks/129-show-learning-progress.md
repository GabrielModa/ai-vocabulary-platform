# Task 129 — Show learning progress

## Status

Approved

## Goal

Turn locally stored attempts into an accessible, pedagogical progress summary based on the versioned
mastery engine rather than gamification.

## Acceptance criteria

- Show distinct counts for new, learning, review, and mastered knowledge items.
- Show how many items are due now and the learner's aggregate retrieval accuracy.
- Identify a bounded set of priority words from due or weak projections.
- Derive all values from immutable completed sessions and the current learning algorithm.
- Do not present XP, streaks, or a single attempt as mastery.
- Render the summary with text labels and accessible structure.

## Allowed files

- `apps/web/app/learning-progress-summary.ts`
- `apps/web/app/learning-progress-summary.test.ts`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/styles.css`
- `apps/web/app/page.test.tsx`
- `docs/decisions/ADR-0051-visible-learning-progress.md`
- `tasks/129-show-learning-progress.md`

## Verification

Run the summary and page tests, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in
order.
