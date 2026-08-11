# ADR-0046 — Route trusted candidates before Ollama

## Status

Accepted

## Context

The trusted topic catalog removes the model from candidate discovery for covered themes, but the
generation route previously called Ollama unconditionally. The existing replacement loop already
tracks exclusions, requests only the current deficit, and requires lexical enrichment before a
candidate becomes usable.

## Decision

Insert a trusted-first candidate adapter at the existing suggestion port. When a covered catalog has
candidates after exclusions, adapt only their term and part of speech to the current transient
generation shape. Keep all learner-facing lexical content dependent on the existing OEWN, frequency,
example, pronunciation, quality, and exercise validation pipeline.

Call Ollama with the unchanged request and exclusion set only when the topic is unsupported or the
catalog is exhausted.

## Consequences

- Covered topics skip the dominant model latency while preserving verification.
- Rejected local candidates are replaced first from the remaining local pool.
- Uncommon topics retain the bounded AI fallback.
- The transient generation contract still contains placeholder fields; these never bypass enrichment
  and should be removed in a future contract version.
