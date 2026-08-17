# Task 146 — Learner-first MVP finish

Finish the no-image web MVP by making the most valuable next action obvious and making local
generation understandable without changing lexical, exercise-publication, image, or persistence
contracts.

## Allowed files

- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/page.test.tsx`
- `apps/web/app/styles.css`
- `apps/web/app/ux-polish.css`
- `apps/web/next-env.d.ts` (Next.js-generated route type reference)
- `docs/mvp/reviewed-learning-baseline.md`
- `tasks/146-learner-first-mvp-finish.md`

## Acceptance criteria

- Returning learners see today's adaptive review before the new-set form when review is available.
- Topic generation defaults to 10 words, while keeping the existing explicit range.
- Local generation exposes truthful staged guidance and reassures the learner that images are not
  part of the wait when visual clues are disabled.
- Review readiness uses learner-facing language; implementation scores and provisional counts are
  placed behind optional details.
- Existing build, review, study, practice, history, accessibility, and no-image behavior remain
  unchanged.
- Tests cover the new priority, default, loading, and readiness behavior.
- `pnpm mvp:verify` and the repository quality gates pass.

## Product decision

The MVP optimizes for focused sessions of 8–12 words. Ten is the default; larger sets remain an
explicit learner choice. Generation stages communicate elapsed work, not fabricated percentage or
provider progress.
