# ADR-067 — Authenticated study-session HTTP adapter

## Status

Accepted.

## Context

Tasks 063–066 established immutable snapshots, persistence, application use cases, and ownership.
The Web runtime does not yet expose a configured Better Auth instance or a server-side generation
draft store.

Accepting exercise sentences, answers, or options from a client would allow tampered learning
content to be persisted. Returning the snapshot directly would also reveal correct answers before
submission.

## Decision

Add an authenticated Next.js HTTP adapter with injected dependencies.

The create request contains only an opaque `draftId`, title, level, and selected candidate IDs. A
server-side draft port resolves that request into the trusted Task 065 input. The adapter never
accepts exercise content from the client.

Authentication is resolved through `SessionIdentityPort<Headers>`. Anonymous requests receive 401
and non-learner identities receive 403. Creation delegates to the ownership-aware application from
Task 066.

Public responses omit answers, source sentences, candidate IDs, sense IDs, example IDs, and
provenance.

Runtime composition and concrete route exports remain deferred until Better Auth and
generation-draft storage are available.

## Consequences

The transport contract is secure and fully testable. Task 068 can wire concrete route files without
changing status mapping, public serialization, or authorization behavior.
