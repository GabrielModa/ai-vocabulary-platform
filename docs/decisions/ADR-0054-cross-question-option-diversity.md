# ADR-0054 — Cross-question option diversity

## Status

Accepted — 2026-08-18

## Context

Individual validation prevented duplicate options inside one question, but the session planner only
balanced total distractor usage. Different questions could therefore reuse the same wrong-answer
block while changing only the correct answer, exposing a generator pattern instead of testing
contextual knowledge.

## Decision

The exercise-set adapter records individual distractor use and pair co-occurrence. Among equally
used compatible candidates, selection prefers lower accumulated pair burden before applying
frequency distance and deterministic ID ordering.

Hard requirements remain authoritative: verified sense, matching part of speech, distinct lemma, and
sufficient pool depth. Diversity cannot make an invalid distractor eligible.

## Consequences

- Deep pools produce more varied option combinations.
- Selection remains deterministic and replayable.
- Small compatible pools may still repeat pairs because three wrong answers require sufficient
  alternatives; that is a coverage limitation rather than a hidden fallback.
- Quality benchmarks can measure maximum option-pair reuse per set.

## Rollback

Stop passing pair history from the adapter and remove pair burden from selection. No persisted data
or public API requires migration.
