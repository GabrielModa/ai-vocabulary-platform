# ADR-071 — Draft-backed review to study-session flow

## Status

Accepted.

## Decision

The review UI consumes the authenticated generation envelope and retains the opaque draft reference.
Starting training sends only the draft ID, reviewed title, level, and selected candidate IDs to
`POST /api/study-sessions`.

Training begins only after the server returns a persisted study-session ID. The browser never sends
exercise bodies, answers, provenance, or learner identity. Authentication failure, expired drafts,
invalid selection, and service unavailability receive distinct learner-facing messages.

Authoritative answer submission and scoring remain deferred to Task 072.
