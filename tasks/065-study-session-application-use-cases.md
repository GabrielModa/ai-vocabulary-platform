# Task 065 — Study-session application use cases

## Goal

Orchestrate creation and retrieval of study sessions through a pure repository port.

## Acceptance criteria

- Creation invokes the Task 063 snapshot builder.
- Invalid input never reaches persistence.
- New saves return `created`.
- Idempotent saves return `existing`.
- Repository conflicts remain typed.
- Omitted candidate IDs are returned.
- Retrieval normalizes session IDs.
- Blank and unknown IDs return the same safe not-found result.
- No database implementation, HTTP, auth, clock, network, AI, or UI dependency is used.

## Next checkpoint

Expose authenticated HTTP create/read endpoints backed by the database repository.
