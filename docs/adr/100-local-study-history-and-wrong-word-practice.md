# ADR 100 — Local completed-session events

## Decision

Completed study sessions are stored on the learner's device as versioned, append-only event
snapshots. Each event contains the exercise facts used for that session, the learner's attempts, and
the derived session score. Repeating wrong words creates a new session and later a new event; the
original event is never edited.

History is bounded to the most recent 50 sessions and one megabyte of serialized input. Invalid
local data is removed. A session identifier makes completion idempotent.

## Boundaries

This history is evidence of attempts, not a mastery score, spaced-repetition schedule, account
record, or cross-device backup. Voided attempts remain auditable but are excluded from scoring and
wrong-word retry selection.

## Consequences

The learner can inspect recent practice and immediately retry mistakes without waiting for image
generation or regenerating lexical content. A later learning engine can consume these immutable
events through a separate repository port and versioned scheduling algorithm.
