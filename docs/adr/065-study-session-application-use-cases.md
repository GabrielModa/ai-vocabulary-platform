# ADR-065 — Study-session application use cases

## Status

Accepted.

## Context

Tasks 063 and 064 established the immutable study-session aggregate and its database repository.
Transport code must not build snapshots, interpret validation failures, or directly coordinate
persistence.

The repository has no dedicated application package, so the vocabulary package is the existing
location for pure orchestration around vocabulary-domain behavior.

## Decision

Add a study-session application service with two operations:

- `create`: build the domain snapshot, persist it through a structural repository port, and return a
  typed created, existing, invalid, or conflict result;
- `get`: normalize the session ID, load through the port, and return a typed found or safe not-found
  result.

The port uses the domain snapshot contract. The database repository satisfies it structurally
without creating a domain-to-database dependency.

No HTTP, authentication, database connection, clock, AI, or UI concern is introduced.

## Consequences

Task 066 can adapt these typed operations to authenticated HTTP endpoints without duplicating domain
or persistence rules.
