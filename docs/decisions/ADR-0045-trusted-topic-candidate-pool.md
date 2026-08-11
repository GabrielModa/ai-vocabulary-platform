# ADR-0045 — Use a fact-free local candidate pool for common topics

## Status

Accepted

## Context

The vocabulary benchmark showed that local Ollama candidate suggestion consumes more than 99% of
request latency, while lexical enrichment and validation complete in under 100 milliseconds.
Candidate terms for common topics are stable, but definitions, senses, examples, CEFR conclusions,
and exercise correctness must still come from trusted evidence and deterministic validation.

## Decision

Maintain a small, versioned, deterministic catalog containing only English terms, part of speech,
and an editorial CEFR ranking hint for common topics. Resolve stable topic aliases, prefer the
requested level, and filter previously attempted terms. The catalog is not a lexical authority and
must never supply meanings, definitions, examples, or exercises.

Downstream lexical providers and validators remain mandatory. Unsupported topics and catalog
deficits continue to the bounded Ollama fallback.

## Consequences

- Common-topic candidate discovery becomes effectively immediate.
- The catalog cannot silently introduce unverified lexical facts.
- Catalog versions make cache invalidation and provenance explicit.
- Coverage is initially limited and requires measured expansion.
- A following task must integrate the pool before Ollama and benchmark the resulting route.
