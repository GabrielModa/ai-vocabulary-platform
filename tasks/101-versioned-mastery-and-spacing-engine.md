# Task 101 — Versioned mastery and spacing engine

## Goal

Create a pure, deterministic and replayable learning reducer that converts immutable retrieval
events into mastery evidence and a UTC review schedule.

## Allowed files

- `packages/vocabulary/src/learning-engine.ts`
- `packages/vocabulary/src/learning-engine.test.ts`
- `packages/vocabulary/src/index.ts`
- `docs/adr/101-versioned-mastery-and-spacing-engine.md`
- `tasks/101-versioned-mastery-and-spacing-engine.md`

## Acceptance criteria

- Learning events have stable identities, authoritative recorded times, UTC instants, and an
  explicit algorithm version.
- The pure reducer is deterministic, idempotent, immutable, and replayable in deterministic order.
- Correct retrieval increases stability and delays review; failure records a lapse and schedules an
  earlier review.
- Late review is never punished merely for being late.
- One correct multiple-choice answer can never mark a word mastered.
- Projection exposes new, learning, review, and mastered states separately from rewards.
- Invalid events, version mismatches, duplicate identifiers with conflicting data, and cross-word
  reductions fail explicitly.
- Unit tests cover first evidence, repeated success, lapse, lateness, idempotency, replay ordering,
  immutability, and invalid input.
- Documentation and all repository quality gates pass.

## Rollback

Remove the learning-engine module and export. Existing immutable session history remains unchanged.
