# ADR-066 — Study-session ownership before HTTP exposure

## Status

Accepted.

## Context

The persisted snapshot introduced in Task 064 is content-focused and has no learner identity.
Exposing authenticated read endpoints using only `sessionId` would allow any authenticated learner
who obtained another session ID to read that session.

## Decision

Add a separate ownership association between authenticated subject IDs and immutable session
snapshots.

Snapshots remain deduplicated and immutable. Ownership is idempotent and multiple learners may own
the same content snapshot. Retrieval checks ownership before loading content and returns the same
safe not-found response for missing and unauthorized sessions.

Add an ownership-aware application service that wraps Task 065. HTTP remains deferred until this
authorization invariant exists.

## Consequences

Task 067 can expose create/read endpoints without cross-learner disclosure. The original 72-task MVP
estimate remains unchanged by combining later integration checkpoints.
