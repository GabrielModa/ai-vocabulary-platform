# Task 045 — Confirm ambiguous lexical senses

## Goal

Require learners to resolve selected OEWN candidates with multiple compatible senses before
training, without exposing definitions during ordinary review.

## Allowed files

- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/lexical-review.ts`
- `apps/web/app/lexical-review.test.ts`
- `apps/web/app/page.test.tsx`
- `apps/web/app/styles.css`
- `docs/AI_SYSTEM.md`
- `tasks/045-confirm-lexical-sense.md`

## Acceptance criteria

- Browser candidate types preserve lexical status, senses, sense ID, and provenance from the API.
- A selected provisional candidate with multiple compatible senses blocks training.
- Definitions remain hidden until the learner opens the explicit meaning confirmation control.
- Selecting a compatible sense replaces the provisional meaning and marks the candidate verified.
- Unselected ambiguous candidates do not block a session with at least four resolved selections.
- The unresolved state and resolution controls are accessible by keyboard and assistive technology.

## Verification

- Unit tests cover compatible ambiguity, resolution, and unresolved selection counting.
- Web interaction test covers the hidden definition, blocked action, and explicit confirmation path.
- Repository quality gates.

## Rollback

Remove the confirmation controls and restore the original minimum-selection start condition.
