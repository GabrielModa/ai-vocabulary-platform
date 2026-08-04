# ADR-063 — Immutable study-session snapshot

## Status

Accepted.

## Context

The generation API now exposes verified published exercises, but the live candidate response is not
a stable persistence format. Candidates may be provisional, rejected, awaiting fallback, reordered,
or enriched differently in a later request.

The database currently contains only platform infrastructure tables. Introducing product tables
before defining the stored aggregate would couple migrations to an unstable shape.

## Decision

Define an immutable, versioned study-session snapshot in the vocabulary domain.

The builder receives explicit selected candidate IDs, candidate pipeline outcomes, title, level, and
a caller-provided canonical timestamp. It:

- includes only `publish` outcomes;
- preserves explicit selection order;
- removes duplicate selections;
- omits missing, fallback, rejected, mismatched, and duplicate exercises;
- copies learner-facing exercise content and provenance;
- generates a deterministic versioned session ID;
- rejects a session containing no published exercises.

The snapshot stores no AI fallback request, ranking evidence, provisional lexical choices, or
internal distractor candidate IDs.

This task defines the persistence payload but does not write to a database.

## Consequences

The next migration and repository can persist a stable aggregate without importing web response
types or reconstructing exercises later. Existing generated responses remain independent of saved
sessions.

## Rollback

Remove the snapshot module, tests, export, ADR, and Task 063 document.
