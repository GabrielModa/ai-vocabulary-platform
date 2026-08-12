# ADR-0051 — Visible learning progress

## Status

Accepted

## Context

The product stored completed attempts and planned adaptive review, but learners could only see
recent session scores. A score describes one session; it does not establish durable knowledge.
Showing XP or streaks would also mix engagement signals with the learning engine's evidence.

## Decision

Derive a local progress summary by replaying immutable completed attempts through the current
versioned learning algorithm. The interface exposes separate `new`, `learning`, `review`, and
`mastered` counts, due work, aggregate retrieval accuracy, and a bounded priority list.

Mastery remains the domain engine's projection. The UI does not promote an isolated correct answer
to mastery and does not persist a second, potentially stale copy of the derived summary. Priority
words are due projections ordered by learning state, lapses, and schedule.

## Consequences

- Learners can see meaningful progress and immediately identify review work.
- Algorithm changes can recompute the view from source attempts instead of migrating derived data.
- The summary is device-local until account synchronization is deliberately introduced.
- Aggregate accuracy remains supporting context and is not itself a mastery score.
