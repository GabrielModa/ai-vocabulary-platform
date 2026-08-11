# Task 099 — Interrupted study-session resume

## Goal

Preserve an in-progress training session locally and let the learner explicitly continue or discard
it after a reload.

## Allowed files

- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/page.test.tsx`
- `apps/web/app/styles.css`
- `apps/web/app/interrupted-study-session.ts`
- `apps/web/app/interrupted-study-session.test.ts`
- `docs/adr/099-interrupted-study-session-resume.md`
- `tasks/099-interrupted-study-session-resume.md`

## Acceptance criteria

- Only an already-created training session is persisted; expiring generation review drafts are not.
- The snapshot has an explicit version, save time, seven-day lifetime, and bounded content.
- Local storage is treated as untrusted and malformed, unsupported, oversized, or expired data is
  ignored and removed.
- Candidate facts, selected terms, position, unchecked selection, scored attempts, and feedback are
  restored without changing the exercise content.
- The learner explicitly chooses Continue or Discard; restoration is not silent.
- Completing, resetting, or discarding clears the interrupted snapshot.
- Storage failures never block learning.
- Unit and UI tests cover round-trip, corruption, expiry, continuation, and discard.
- Documentation and all repository quality gates pass.

## Rollback

Remove the local snapshot adapter and resume prompt. Server-side study-session snapshots remain
unchanged.
