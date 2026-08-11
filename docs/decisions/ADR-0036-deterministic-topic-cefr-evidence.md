# ADR-0036 — Deterministic topic relevance and provisional CEFR

## Status

Accepted

## Context

Topic relevance and level fit currently depend mostly on the local model prompt. The repository has
verified frequency evidence but does not yet have a licensed curated CEFR dataset.

## Decision

Measure exact normalized topic-token matches in verified definitions and examples. Use AI suggestion
provenance only as weak fallback evidence. Produce a versioned frequency-based CEFR estimate marked
`provisional`; omit it when frequency is absent. Never store the estimate as an official lexical
classification.

## Consequences

- Ranking becomes explainable and testable without another inference.
- The estimate can be replaced by a curated CEFR provider without changing lexical provenance.
- Semantically related terms without an exact token match receive conservative relevance until a
  licensed relation-aware provider is integrated.
