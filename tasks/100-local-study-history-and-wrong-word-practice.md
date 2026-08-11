# Task 100 — Local study history and wrong-word practice

## Goal

Record completed study sessions locally as immutable learning events and let the learner start a
focused retry containing only the words answered incorrectly.

## Allowed files

- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/page.test.tsx`
- `apps/web/app/styles.css`
- `apps/web/app/local-study-history.ts`
- `apps/web/app/local-study-history.test.ts`
- `apps/web/app/interrupted-study-session.ts`
- `docs/adr/100-local-study-history-and-wrong-word-practice.md`
- `tasks/100-local-study-history-and-wrong-word-practice.md`

## Acceptance criteria

- A completed session is appended exactly once as a versioned immutable local event.
- Stored history is bounded and local storage is treated as untrusted.
- Malformed, unsupported, oversized, or invalid records are ignored and removed.
- Voided meaning-correction attempts are retained but excluded from score and retry selection.
- The result report offers “Practice wrong words” only when scorable mistakes exist.
- A focused retry preserves the verified exercise content and starts with a clean score.
- Recent session summaries are visible on the capture screen and do not claim learner mastery.
- Storage failures never interrupt learning.
- Unit and UI tests cover append, deduplication, corruption, bounded retention, and focused retry.
- Documentation and all repository quality gates pass.

## Rollback

Remove the local history adapter, recent-practice summary, and focused retry action. Interrupted
session resume remains available independently.
