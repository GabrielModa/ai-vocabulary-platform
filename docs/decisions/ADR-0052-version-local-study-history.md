# ADR-0052 — Version local study history

## Status

Accepted

## Context

Completed study sessions are the local source evidence for mastery and scheduling. The original
storage envelope used the same `version` name as the immutable session event and deleted every
unrecognized version. That made future upgrades capable of destroying newer data when opened by an
older client.

## Decision

Use a version 2 storage envelope identified by `schemaVersion`, while keeping each completed session
as an immutable version 1 event. Read and fully validate the legacy `{ version: 1, sessions }`
envelope before rewriting it as `{ schemaVersion: 2, sessions }`.

If the migration write fails, return the validated legacy sessions and leave the source usable. If
an unknown `schemaVersion` is encountered, return no sessions to this client but preserve the stored
payload and refuse to append over it. Structurally malformed current or legacy data remains removed
because it cannot be trusted safely.

Derived mastery and progress summaries are not persisted. They are replayed from source sessions
using the versioned learning algorithm.

## Consequences

- Existing learners migrate without an explicit action or data loss.
- Older clients cannot overwrite a future storage schema.
- Source history remains the single authority for recalculating learning projections.
- Device-local storage is still bounded to 50 sessions and one megabyte.
