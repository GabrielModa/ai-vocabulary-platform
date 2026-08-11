# ADR-0042 — Instrument deficit replacement at stage boundaries

## Status

Accepted

## Context

Total request latency cannot distinguish model generation from deterministic lexical enrichment or
retry work. Instrumentation must remain testable without a configured telemetry provider.

## Decision

Add an optional metric sink and injectable monotonic clock to deficit replacement. Emit bounded
metrics after each suggestion and enrichment attempt, followed by one exact/partial replacement
summary. Normalize every event through the privacy-safe observability contract.

## Consequences

- Benchmarks can attribute latency without changing generation behavior.
- Tests control time without sleeping.
- Production may connect any failure-isolated exporter later.
- Lookup cache state remains `false` until lookup loading exposes explicit cache evidence.
