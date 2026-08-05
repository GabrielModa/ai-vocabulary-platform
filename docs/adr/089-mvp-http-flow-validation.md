# ADR-089 — MVP HTTP Flow Validation

## Status

Accepted.

## Context

The reviewed lexical flow has focused coverage for publication, persistence, snapshots, public
serialization, and answer evaluation. The remaining MVP risk is at the HTTP boundary: a valid review
could succeed internally while route composition, draft identifiers, trusted metadata, session
creation, retrieval, or answer submission fails when combined.

## Decision

Add an end-to-end HTTP contract test that composes the real production handlers with in-memory
repositories and applications.

The test performs the complete learner journey:

1. resolve a trusted reviewed generation draft;
2. create a study session from the resulting draft;
3. inspect the answer-free creation response;
4. retrieve the owned session;
5. submit the authoritative correct answer;
6. verify the scored response.

The fixture intentionally contains four compatible lexical noun candidates without cloze evidence,
so successful completion proves the definition-choice fallback eliminates the historical
`no-published-exercises` failure.

No external model, network service, browser, or database is required. Those integrations remain
outside this deterministic MVP contract.

## Consequences

The main MVP workflow is protected at its public HTTP boundaries. Changes to authentication, review
resolution, trusted draft metadata, publication, session creation, retrieval, public projection, or
answer evaluation must continue to satisfy the same learner journey.
