# ADR-084 — Persistent Definition Choice Mapping

## Status

Accepted.

## Context

The study-session persistence contract accepts only the legacy verified cloze exercise. A published
definition-choice exercise therefore cannot enter a trusted draft or session snapshot even though it
is valid domain content.

## Decision

Introduce a persistence mapper for `PublishedDefinitionChoice` and evolve the persistent exercise
contract into a discriminated union:

- legacy `cloze`;
- new `definition-choice`.

The mapper validates the four-option invariant, resolves the correct answer, retains stable IDs,
candidate and knowledge identity, choice IDs, and lexical provenance.

`buildStudySessionSnapshot` now snapshots both exercise kinds while preserving all legacy cloze
behavior.

This task changes domain persistence contracts only. It does not yet alter generation, draft
resolution, HTTP routes, or UI behavior.

## Consequences

Trusted drafts and session snapshots can represent definition-choice exercises. Task 085 can route
the lexical publisher output into draft resolution without redesigning persistence again.
