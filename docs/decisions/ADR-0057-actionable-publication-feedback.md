# ADR-0057: Keep final exercise validation strict and make failure actionable

## Status

Accepted on 2026-08-12.

## Decision

The review screen's readiness report is advisory. Draft resolution remains the authoritative final
exercise-publication gate. When that gate omits candidates or publishes none, the client uses the
structured response code and opaque candidate IDs to show learner-facing word names and recovery
guidance. It never exposes answers, provider internals, or validation prompts.

## Consequences

- Validation is not weakened to improve apparent success.
- Learners can identify and replace only failed words.
- Advisory readiness no longer sounds like a publication guarantee.
