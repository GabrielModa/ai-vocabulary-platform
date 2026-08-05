# ADR-069 — Persistent learner-bound generation drafts

## Status

Accepted.

## Context

The authenticated study-session POST introduced in Task 067 accepts an opaque draft ID and delegates
trusted input resolution to a server-side port. Task 068 intentionally left that port unconfigured.

Persisting client-provided exercises would allow answer and provenance tampering. A process-memory
draft would be lost across deploys and would not work reliably across multiple Web instances.

## Decision

Persist vocabulary-generation drafts in PostgreSQL with an opaque draft ID, authenticated subject
ID, creation and expiration timestamps, and a versioned trusted payload.

Resolution requires a matching learner, draft ID, and unexpired timestamp. Missing, expired, and
cross-learner drafts are indistinguishable. Client title, level, and selected candidate IDs are
validated against the trusted payload before producing `BuildStudySessionSnapshotInput`.

The database repository stores an opaque payload and remains independent of vocabulary-domain types.
The Web adapter owns payload validation and conversion.

Task 069 does not alter the generation endpoint because that endpoint still lacks concrete
authenticated identity bootstrap. Task 070 will authenticate generation, save these drafts, and
register the runtime adapters.

## Consequences

Study-session creation now has durable, horizontal-scale-safe draft resolution. No exercise content
needs to be accepted from the browser.
