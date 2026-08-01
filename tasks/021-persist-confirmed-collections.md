# 021 — Persist confirmed vocabulary collections

## Goal

Persist learner-owned vocabulary collections behind a repository port with ownership-safe reads and
optimistic version checks.

## Requirements

- Store and retrieve complete validated collections by owner and identifier.
- Reject stale writes and duplicate creation.
- Return defensive copies so callers cannot mutate stored state.
- Provide deterministic in-memory persistence for application and contract tests.

## Files allowed

`packages/vocabulary/**`, `tasks/**`, persistence architecture documentation.

## Expected commit

`feat(vocabulary): persist confirmed collections`
