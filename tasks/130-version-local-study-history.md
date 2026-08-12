# Task 130 — Version local study history

## Status

Approved

## Goal

Make completed-session persistence forward-safe and explicitly migratable without duplicating
derived mastery state.

## Acceptance criteria

- Newly written history uses a version 2 storage envelope.
- A valid version 1 envelope migrates to version 2 after complete validation.
- A failed migration write still returns validated sessions without losing the version 1 source.
- Unknown future versions are preserved rather than deleted.
- Malformed or internally inconsistent current data remains rejected.
- Completed sessions remain immutable version 1 source events.

## Allowed files

- `apps/web/app/local-study-history.ts`
- `apps/web/app/local-study-history.test.ts`
- `docs/decisions/ADR-0052-version-local-study-history.md`
- `tasks/130-version-local-study-history.md`

## Verification

Run the local history tests, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in
order.
