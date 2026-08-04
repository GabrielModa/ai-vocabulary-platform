# Task 063 — Immutable study-session snapshot

## Goal

Create the stable versioned aggregate that will be persisted when a learner starts a session.

## Acceptance criteria

- Only selected publish outcomes are included.
- Selection order is preserved.
- Duplicate selections are removed.
- Fallback, reject, missing, and mismatched candidates are omitted.
- A session with no published exercise fails.
- Exercise sentence, answer, options, IDs, and provenance are copied.
- Exactly four options are retained.
- Timestamp is explicit and canonical.
- Session IDs are deterministic and versioned.
- Snapshot collections are frozen.
- No web type, database call, network, AI, clock, or randomness is used.

## Next checkpoint

Add the database schema and repository for idempotently saving and loading study-session snapshots.
