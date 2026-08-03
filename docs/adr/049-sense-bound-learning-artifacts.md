# ADR-049 — Sense-bound learning artifacts

## Status

Accepted.

## Context

The verified candidate pipeline gives each accepted candidate a stable `candidateId` and an atomic
selected lexical sense. Exercises and images are still represented by application-specific fields
and requests, so their semantic relationship to the selected sense is not a domain invariant.

## Decision

Introduce provider-neutral learning artifacts in the vocabulary domain.

Every artifact records:

- a deterministic artifact ID;
- the candidate ID;
- the selected lexical sense ID;
- the source definition used to create it;
- artifact type and lifecycle status;
- version, source metadata, and creation time.

Exercise and image artifacts share the same base identity. Artifact creation requires a selected
sense. Domain helpers detect when an artifact is stale after candidate or sense changes and return
immutable stale or invalid copies.

## Alternatives rejected

- Keep artifact state inside React: lifecycle and invalidation would remain untestable outside the
  UI.
- Store artifacts directly on `LearningCandidate`: candidates identify learning targets, not every
  generated or retrieved representation.
- Model only exercises: image, audio, example, and pronunciation features would duplicate the same
  identity and lifecycle rules later.
- Add persistence now: persisted schema should follow stable domain contracts, not define them.

## Consequences

Future exercise, image, audio, example, and pronunciation implementations can share semantic
identity and lifecycle rules. The web flow is intentionally not migrated in this checkpoint, so
there is no visible product change yet.

## Rollback

Remove the learning-artifact module, its export, tests, ADR, and Task 049 documentation. Candidate
pipeline behavior remains unchanged.
