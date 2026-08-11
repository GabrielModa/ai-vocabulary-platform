# Task 123 — Mastery-based exercise progression

## Status

Approved

## Goal

Select exercise difficulty from demonstrated mastery and available verified capabilities instead of
using CEFR alone.

## Acceptance criteria

- Keep CEFR as content calibration, not learner mastery.
- Use definition choice for new knowledge and recovery after a lapse.
- Prefer verified cloze during learning and review.
- Prefer typed recall only after sufficient successful retrieval evidence.
- Fall back deterministically when the preferred mode is unavailable.
- Return an explicit rationale and version for observability and future migrations.
- Cover new, learning, lapsed, review, mastered, and fallback paths.

## Allowed files

- `packages/vocabulary/src/exercise-progression.ts`
- `packages/vocabulary/src/exercise-progression.test.ts`
- `packages/vocabulary/src/index.ts`
- `docs/decisions/ADR-0047-mastery-based-exercise-progression.md`
- `tasks/123-mastery-based-exercise-progression.md`

## Verification

Run the targeted domain tests, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in
that order.
