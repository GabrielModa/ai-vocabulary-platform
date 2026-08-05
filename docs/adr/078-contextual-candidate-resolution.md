# ADR-078 — Contextual Candidate Resolution

## Status

Accepted.

## Context

Task 077 validates an AI decision over a closed set of official lexical senses. The existing
pipeline still needs a domain bridge that converts a valid contextual decision into a verified
`LearningCandidate` before web and Ollama integration.

## Decision

Introduce `resolveCandidateContextually`.

The policy:

- uses the deterministic path for a single selectable sense;
- accepts only decisions validated by `selectContextualSense`;
- records AI resolution as `contextual-ai-selection`;
- upgrades a successfully resolved candidate to `verified`;
- keeps invalid or unavailable AI selections as `needs-review`;
- rejects candidates with no selectable lexical evidence.

The policy is fail-soft for AI failures and fail-closed for missing lexical truth.

Runtime and Ollama integration are intentionally deferred to Task 079 so the domain transition is
independently tested before touching the generation route.
