# ADR-0043 — Content-free local vocabulary benchmark

## Status

Accepted

## Context

Pipeline instrumentation needs a repeatable execution profile before latency changes can be judged.
Persisting generated content would create privacy, licensing, and review concerns.

## Decision

Provide smoke and extended matrices with predefined representative inputs. Emit only case IDs, CEFR
levels, requested counts, aggregate fulfillment, and bounded stage percentiles. Write JSON to stdout
and no artifact by default.

## Consequences

- Developers can compare changes on the same hardware.
- Reports are safe to share without generated learning content.
- Smoke runs remain small enough for local iteration.
- Cross-machine comparisons require recording environment details separately.
