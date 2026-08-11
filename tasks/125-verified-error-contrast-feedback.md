# Task 125 — Verified error contrast feedback

## Status

Approved

## Goal

Turn an incorrect response into a concise semantic contrast using only reviewed lexical content.

## Acceptance criteria

- Contrast the chosen and correct meanings when both candidates are known.
- Point out part-of-speech mismatch when it provides a deterministic grammatical cue.
- Handle free-text errors without treating arbitrary learner input as lexical fact.
- Never call AI or invent definitions in the feedback path.
- Bound learner input and render it as text.
- Show the contrast only after the attempt, preserving retrieval-first behavior.
- Cover same-class, different-class, and unknown typed responses.

## Allowed files

- `apps/web/app/verified-error-feedback.ts`
- `apps/web/app/verified-error-feedback.test.ts`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/page.test.tsx`
- `apps/web/app/styles.css`
- `docs/decisions/ADR-0049-verified-error-contrast-feedback.md`
- `tasks/125-verified-error-contrast-feedback.md`

## Verification

Run targeted feedback and page tests, then all four repository quality gates in order.
