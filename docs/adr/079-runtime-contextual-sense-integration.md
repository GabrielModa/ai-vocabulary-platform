# ADR-079 — Runtime Contextual Sense Integration

## Status

Accepted.

## Decision

Integrate contextual sense resolution after the existing lexical enrichment pipeline.

The existing pipeline remains responsible for candidate normalization, lexical evidence, frequency,
examples, ranking, and current exercise metadata. A new runtime layer examines provisional
candidates, sends only their verified senses to the constrained Ollama selector, and upgrades valid
results to verified candidates.

The runtime is fail-soft. Invalid or unavailable selector output preserves the provisional candidate
and the existing learner correction path.

This placement minimizes changes to the stable enrichment pipeline while making automatic sense
selection visible to the product immediately.
