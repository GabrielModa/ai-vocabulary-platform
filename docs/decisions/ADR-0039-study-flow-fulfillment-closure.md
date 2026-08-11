# ADR-0039: Keep UI fulfillment aligned with published exercises

## Status

Accepted

## Context

Generation may honestly return fewer candidates than requested, and draft resolution may omit an
exercise that fails final verification. The client previously ignored both differences.

## Decision

Show a locally derived partial-fulfillment notice using bounded numeric response fields. At session
creation, replace the client selection with exactly the candidate IDs published by the trusted
resolver. Do not start a four-option session when fewer than four candidates are published.

## Consequences

- Learners see the actual set size before training.
- Rejected exercises cannot re-enter through stale client state.
- Existing local persistence and adaptive planning remain unchanged.
