# Task 114 — Study flow fulfillment closure

## Status

Approved

## Goal

Close the remaining UI integration gaps around partial generation and backend-published exercises.

## Acceptance criteria

- Surface exact requested and delivered counts for partial generation.
- Derive learner-facing copy locally instead of trusting an external message.
- Never begin training with candidates omitted by the verified draft resolver.
- Require at least four published candidates before starting a four-option session.
- Preserve the existing Study/Test, history, resume, wrong-word, and adaptive-review behavior.

## Allowed files

- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/page.test.tsx`
- `docs/decisions/ADR-0039-study-flow-fulfillment-closure.md`
- `tasks/114-study-flow-fulfillment-closure.md`

## Verification

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in that order.
