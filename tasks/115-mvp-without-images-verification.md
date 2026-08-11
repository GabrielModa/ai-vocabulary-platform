# Task 115 — MVP without images verification

## Status

Approved

## Goal

Prove that the complete vocabulary learning flow remains usable when visual clues are disabled.

## Acceptance criteria

- Verify candidate generation, trusted review, Study/Test modes, session creation, answers, and
  reporting without an image worker.
- Verify that disabling visual clues causes no image enqueue, polling, or prefetch work.
- Verify exact and partial fulfillment behavior through the published exercise boundary.
- Run the focused MVP verification and all repository quality gates.
- Record any environment limitation honestly instead of weakening readiness checks.

## Allowed files

- `package.json`
- `docs/decisions/ADR-0040-mvp-without-images-verification.md`
- `tasks/115-mvp-without-images-verification.md`

## Verification

Run `pnpm mvp:verify`, followed by `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in
that order.
