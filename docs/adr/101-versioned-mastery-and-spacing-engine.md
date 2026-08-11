# ADR 101 — Deterministic mastery and spacing baseline

## Decision

Use `lexi-spacing-v1`, a pure reducer over immutable retrieval events. The projection tracks
stability, difficulty, successful retrievals, lapses, an evidence score, and the next UTC review.
Events are ordered by authoritative `recordedAt` and then by identifier, making replay independent
of ingestion order.

The initial interval grows after successful retrieval and contracts after a lapse. Lateness can
increase evidence because delayed retrieval is useful, but lateness alone never reduces mastery.
Multiple-choice recognition contributes limited evidence, so no single answer can produce mastery.

## Boundaries

This version models meaning recognition from the current exercise. Spelling, listening,
pronunciation, production, hints, latency calibration, time-zone study days, workload caps, and
randomized fuzzing remain explicit future dimensions. Rewards and commercial state cannot modify the
projection.

## Rollback and evolution

Events keep their algorithm version. A future reducer is added beside v1 and projections can be
rebuilt from the same events; v1 is not silently reinterpreted.
