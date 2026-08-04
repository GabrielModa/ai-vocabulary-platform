# Task 066 — Study-session ownership

## Goal

Bind immutable study sessions to authenticated learners before exposing HTTP routes.

## Acceptance criteria

- Ownership uses subject ID plus session ID.
- Binding is idempotent.
- Missing snapshots cannot receive ownership.
- Different learners do not inherit ownership.
- Retrieval checks ownership before loading a snapshot.
- Missing and unauthorized sessions return the same safe result.
- Blank identities fail safely.
- Snapshot content remains unchanged and deduplicated.
- PGlite integration tests cover ownership persistence.

## Next checkpoint

Expose authenticated create/read HTTP endpoints using the ownership-aware application.
