# ADR-056 — Verified exercise composer

## Status

Accepted.

## Context

The domain can select deterministic distractors and build a sense-bound cloze, but callers still
need to coordinate those components, filter examples by sense, retry invalid examples, and preserve
provenance. Repeating that orchestration in API routes or UI code would duplicate pedagogical rules.

## Decision

Introduce a pure `composeVerifiedExercise` domain function.

The composer:

- requires a confirmed lexical sense;
- filters examples by the exact `senseId`;
- selects three deterministic distractors once;
- tries verified examples in their supplied order;
- returns the first valid sense-bound cloze;
- records typed causes for every rejected example;
- preserves lexical and example source record IDs;
- creates a deterministic versioned exercise ID;
- returns immutable success and failure results.

The composer does not claim sentence-level semantic uniqueness. That validation remains a separate
checkpoint.

## Alternatives rejected

- Compose in the API route: couples transport code to pedagogical policy.
- Retry distractor selection for each example: creates unnecessary work and unstable behavior.
- Throw on expected failures: forces callers into broad exception handling.
- Use the LLM when the first example fails: bypasses other verified examples already available.
- Mark the result semantically validated: part-of-speech compatibility alone cannot prove a single
  correct answer in context.

## Consequences

The rest of the product can consume one `VerifiedExercise` contract instead of coordinating lower
level functions. AI fallback can later operate only after the deterministic composer returns a typed
failure.

## Rollback

Remove the composer, tests, export, ADR, and Task 056 document. The cloze builder and distractor
selector remain independently usable.
