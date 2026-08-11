# Task 124 — Publish adaptive typed recall

## Status

Approved

## Goal

Make mastery-based progression visible in local adaptive review by switching eligible items from
multiple choice to typed recall.

## Acceptance criteria

- Attach a progression plan to every local adaptive review item.
- Offer typed recall only when the versioned mastery policy selects it.
- Keep definition choice and verified cloze as safe fallbacks.
- Normalize typed answers without revealing the answer before submission.
- Preserve feedback, history, spacing evidence, keyboard access, and session continuity.
- Cover plan attachment and the typed UI journey.

## Allowed files

- `apps/web/app/adaptive-local-review.ts`
- `apps/web/app/adaptive-local-review.test.ts`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/page.test.tsx`
- `apps/web/app/styles.css`
- `docs/decisions/ADR-0048-publish-adaptive-typed-recall.md`
- `tasks/124-publish-adaptive-typed-recall.md`

## Verification

Run targeted adaptive review and page tests, then the four repository quality gates in order.
