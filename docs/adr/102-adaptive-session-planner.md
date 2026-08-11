# ADR 102 — Deterministic adaptive session selection

## Decision

The v1 planner selects from mastery projections using explicit policy limits. Due lapses come first,
followed by other due reviews, bounded new material, then weak early reviews when capacity remains.
Future mastered items are excluded. Review and new items are interleaved deterministically to reduce
blocking and guessing patterns.

## Boundaries

The planner consumes learning projections but cannot alter them. It does not use XP, streaks,
payments, or generated confidence. Session-size and new-item limits are configuration. Later
versions may add modality balance, fatigue and learner time zone without reinterpreting v1 plans.
