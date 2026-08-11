# ADR-0041 — Privacy-safe vocabulary generation metrics

## Status

Accepted

## Context

The lexical pipeline needs performance and quality evidence before optimization. Topics, generated
words, definitions, examples, and provider payloads may contain learner or copyrighted content and
must not enter telemetry.

## Decision

Use fixed generation-stage and outcome enums with bounded integer duration, counts, attempts, and a
cache-state boolean. Normalize values before emission and pass them through the existing telemetry
allowlist. Unknown labels collapse to bounded fallback values.

## Consequences

- Latency and fulfillment can be compared without recording learning content.
- Metric cardinality remains bounded.
- Stage-level instrumentation can reuse the existing failure-isolated exporter contract.
- Detailed rejection reasons require a separate fixed taxonomy before they may be measured.
