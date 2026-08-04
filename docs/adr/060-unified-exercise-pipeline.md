# ADR-060 — Unified verified exercise pipeline

## Status

Accepted.

## Context

The domain now has independent components for exercise composition, structural validation,
pedagogical readiness, and AI fallback policy. API or UI callers should not coordinate these stages
or reinterpret their outcomes.

## Decision

Add one pure domain entry point: `runVerifiedExercisePipeline`.

The pipeline executes:

1. deterministic composition;
2. structural and pedagogical readiness evaluation;
3. strict AI fallback policy.

It returns exactly one outcome:

- `publish`: a deterministic exercise is ready for downstream use;
- `request-ai-fallback`: only context rewriting is allowed;
- `reject`: composition or structural policy requires deterministic correction.

Composition failures remain attached as typed causes. Structural-policy rejection carries structural
reason codes. Every outcome is versioned and explicitly reports that semantic uniqueness is not
proven.

The pipeline does not perform provider lookup, call AI, persist data, or depend on transport code.

## Alternatives rejected

- Coordinate stages in the API route: leaks domain policy into transport code.
- Collapse all failures into one generic error: loses remediation information.
- Automatically invoke AI: combines decision policy with side effects.
- Publish every structurally valid exercise: bypasses pedagogical readiness.
- Retry composition randomly: destroys reproducibility.

## Consequences

API, worker, Study, and Test modes gain one stable domain contract. The next checkpoint can
integrate this contract into the vocabulary generation endpoint without duplicating pedagogical
decisions.

## Rollback

Remove the pipeline module, tests, export, ADR, and Task 060 document. All underlying components
remain independently usable.
