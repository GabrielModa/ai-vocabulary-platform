# ADR-0035 — Explainable lexical quality gate

## Status

Accepted

## Context

Exact-count replacement and CEFR ranking need a shared definition of a usable learning candidate. A
single opaque score would make rejections difficult to debug and could hide missing evidence.

## Decision

Evaluate candidates with deterministic evidence dimensions and stable reason codes. Separate the
decision (`accept`, `review`, or `reject`) from the numeric score. Aggregate the same reports into a
set summary that preserves requested-count shortfalls.

## Consequences

- Replacement can request only the measured deficit in a later change.
- Product UI and telemetry can explain why coverage is low without logging learner content.
- CEFR and topic relevance will add dimensions in the next version without changing lexical facts.
