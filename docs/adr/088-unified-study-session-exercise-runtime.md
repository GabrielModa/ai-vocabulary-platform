# ADR-088 — Unified Study-Session Exercise Runtime

## Status

Accepted.

## Context

The study-session API currently owns two separate pieces of exercise behavior:

- public serialization in `response-contract.ts`;
- option validation and answer evaluation in `answer-http.ts`.

Both operate on the same persistent exercise union. Keeping those rules inside HTTP handlers makes
new exercise kinds require edits in multiple endpoints and risks exposing answer data
inconsistently.

## Decision

Introduce `study-session-exercise-runtime.ts` as the single application-level adapter for persisted
study-session exercises.

It provides:

- serialization from a trusted snapshot exercise to its public, answer-free representation;
- normalized option validation;
- answer evaluation shared by every current exercise kind.

The response contract delegates exercise serialization to this adapter. The answer handler delegates
option validation and correctness evaluation to the same adapter.

The adapter depends only on `StudySessionSnapshot` contracts and has no identity, database, route,
or Next.js dependency.

## Consequences

Cloze and definition-choice now share one runtime path after persistence. Adding a future persistent
exercise kind requires extending one runtime adapter rather than duplicating logic across HTTP
handlers. Public responses continue to hide answers, while answer submission behavior remains
unchanged.
