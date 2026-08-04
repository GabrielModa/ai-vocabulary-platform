# ADR-062 — Public exercise response and review consumption

## Status

Accepted.

## Context

Task 061 attached domain pipeline outcomes directly to enriched API candidates. Domain contracts are
not automatically public API contracts and the client still reconstructs exercises from legacy
fields.

## Decision

Add a versioned response DTO. Publish exposes learner-facing exercise content and provenance.
Fallback exposes only operation, request ID, and triggering reasons. Reject exposes summary reason
codes. Internal distractor IDs and full repair contracts remain private.

The web client uses a publish outcome as the source of truth for the gap sentence, options, and
correct answer. Candidates without publish outcomes retain the existing behavior. Fallback and
reject outcomes never become exercises automatically.

## Consequences

The public response is explicit and domain internals can evolve independently. Verified exercises
are used directly by training when available.
