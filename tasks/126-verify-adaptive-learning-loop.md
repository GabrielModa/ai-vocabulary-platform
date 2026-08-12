# Task 126 — Verify the adaptive learning loop

## Status

Approved

## Goal

Prove that completed attempts drive mastery, exercise progression, spacing, and next-session
priority as one deterministic loop.

## Acceptance criteria

- Four successful retrievals advance an eligible item to typed recall.
- A subsequent typed-recall error creates a lapse without deleting prior evidence.
- The lapse schedules review six hours later.
- The item becomes lapsed-due and returns to supported recognition in the next plan.
- The test uses the same completed-session profile and planning adapters as the web product.

## Allowed files

- `apps/web/src/adaptive-learning-loop.test.ts`
- `docs/verification/adaptive-learning-loop.md`
- `tasks/126-verify-adaptive-learning-loop.md`

## Verification

Run the loop test, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in order.
