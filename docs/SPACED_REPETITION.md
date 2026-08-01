# Spaced repetition

## Goal

Schedule effort near the point where retrieval is difficult but still productive, while covering
different mastery dimensions and contexts.

## Baseline model

The initial implementation will use a documented, versioned algorithm selected during architecture
design. It must support stability/difficulty estimates, retrievability, late and early reviews,
partial evidence, lapses, and deterministic scheduling. Algorithm parameters are configuration, not
magic constants.

## Scheduling constraints

- Store instants in UTC and derive local study days from an explicit learner time zone.
- Device clocks are untrusted; offline attempts keep both device and synchronization time.
- Do not penalize lateness or missed streaks in the mastery score.
- Cap daily load and prioritize the most valuable reviews when backlog is large.
- Avoid duplicate concurrent reviews using idempotency and reconciliation rules.

## Validation

Use simulation, property tests, historical replay, and prospective retention measurement. Monitor
calibration by predicted versus observed recall, backlog, lapse rate, workload, and subgroup
fairness. Algorithm changes retain the previous version for replay and rollback.
