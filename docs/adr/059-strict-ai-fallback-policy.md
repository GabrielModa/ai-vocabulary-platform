# ADR-059 — Strict AI fallback policy

## Status

Accepted.

## Context

Task 058 identifies exercises that need fallback, but not every failure should be sent to a language
model. Structural defects, invalid IDs, missing provenance, and malformed options are deterministic
system errors. Asking AI to repair them would hide broken contracts and weaken auditability.

Context-quality failures can be repaired by rewriting only the sentence while preserving verified
facts.

## Decision

Introduce a pure, versioned AI fallback policy.

The policy returns:

- `not-required` when the exercise is already pedagogically ready;
- `allowed` only for context-quality failures;
- `prohibited` whenever structural validation reports any issue.

Allowed fallback is restricted to `rewrite-context-only`. The generated request must preserve:

- answer;
- verified `senseId`;
- all four options;
- lexical and example provenance;
- exactly one gap;
- minimum context;
- absence of visible answer options outside the gap.

The policy creates a deterministic request ID and a narrow output contract containing only
`sourceSentence` and `gapSentence`.

This task does not call a model and does not accept a model response.

## Alternatives rejected

- Send every failure to AI: masks deterministic bugs.
- Let AI replace distractors or the answer: discards verified evidence.
- Let AI change provenance: allows generated content to impersonate verified content.
- Build a free-form prompt in an API route: duplicates policy and weakens testability.
- Call Ollama directly from the domain: violates architectural boundaries.

## Consequences

AI becomes a tightly scoped repair tool instead of a general authority. The next pipeline can decide
whether to publish, request a context rewrite, or return a deterministic failure without guessing.

## Rollback

Remove the policy, tests, export, ADR, and Task 059 document. Readiness results remain available.
