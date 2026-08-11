# ADR-0034 — Resolve context before exercise review

## Status

Accepted

## Context

The initial review can contain ambiguous candidates that only fail exercise publication after the
learner starts training. Restoring an AI call per ambiguous word would increase latency and make a
model authoritative over lexical facts.

## Decision

Use deterministic topic evidence to select a verified lexical sense only when one sense has a
strong, unambiguous advantage. Otherwise preserve learner confirmation. Image generation remains
outside this flow. Exercise readiness becomes the following Quality Gate change.

## Consequences

- Common topic-specific senses can be resolved without network or model latency.
- Ambiguous cases still fail closed and remain under learner control.
- The system needs explicit readiness reasons and later targeted candidate replacement when the
  requested count cannot be published.
