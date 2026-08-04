# ADR-057 — Structural exercise readiness

## Status

Accepted.

## Context

Task 056 returns a composed `VerifiedExercise`, but downstream consumers still need an explicit
readiness decision. The TypeScript contract alone does not protect persisted, transported, migrated,
or externally reconstructed values at runtime.

Semantic uniqueness cannot be proven from part of speech and frequency alone. Calling the current
result semantically valid would overstate what the system knows.

## Decision

Add a pure validator that returns either `structurally-ready` or `not-ready`.

It validates:

- cloze exercise kind and deterministic composition strategy;
- non-empty candidate, sense, example, and exercise IDs;
- exact deterministic exercise ID;
- exactly one gap;
- exactly four unique non-empty options;
- answer present exactly once;
- three unique non-empty distractor candidate references;
- complete lexical and example provenance.

The result explicitly reports `semanticUniqueness: "not-evaluated"`.

The deterministic ID builder is exported from the composer so creation and validation share one
implementation.

## Alternatives rejected

- Trust TypeScript only: runtime data can bypass compile-time types.
- Validate inside React or API handlers: duplicates domain rules.
- Mark structurally valid exercises as semantically unique: unsupported by current evidence.
- Use an LLM as validator: non-deterministic and not yet governed by a fallback policy.
- Stop after the first issue: reduces auditability and makes remediation slower.

## Consequences

API, persistence, Study, and Test modes can rely on an explicit readiness result while preserving
honest uncertainty about contextual ambiguity. The next checkpoint can add a deterministic
sentence-level uniqueness policy without changing the structural contract.

## Rollback

Remove the validator, tests, export, ADR, and Task 057 document, and make the exercise ID helper
private again.
