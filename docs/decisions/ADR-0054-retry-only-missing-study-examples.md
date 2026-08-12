# ADR-0054: Retry only missing study examples

## Status

Accepted

## Context

The local model can return a useful example for one lexical candidate and an invalid or missing
example for another. Rejecting the entire response discards good work, increases latency, and can
leave every learner item without an example.

## Decision

Validate each returned example independently. Keep valid examples in memory and retry only the
unresolved candidates, with three total attempts by default. Never overwrite an accepted example
during the same generation call.

If the retry limit is reached after at least one valid result, return the valid subset. The web
enrichment layer will preserve its honest unavailable placeholder for unresolved candidates. If no
valid result can be recovered, fail with `INVALID_OUTPUT` so callers do not mistake failure for an
empty successful batch.

Provider failure before any useful result remains `UNAVAILABLE`; provider failure after partial
success returns the validated subset.

## Consequences

- A single bad model item no longer erases valid examples.
- Retry prompts and token use shrink with the remaining deficit.
- Partial coverage remains explicit and does not claim corpus verification.
- The operation remains bounded and deterministic at its validation boundary.
