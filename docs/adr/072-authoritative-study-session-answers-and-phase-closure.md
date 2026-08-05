# ADR-072 — Authoritative study-session answers and phase closure

## Status

Accepted.

## Decision

Add an authenticated answer endpoint at:

`POST /api/study-sessions/:id/answers`

The endpoint loads the learner-owned immutable session snapshot, validates that the exercise and
selected option belong to that snapshot, and returns authoritative correctness and the correct
answer. Missing ownership is indistinguishable from a missing session.

No browser-provided answer key, exercise body, provenance, or learner identity is trusted. Scoring
is derived only from the persisted snapshot created by the reviewed-draft flow.

The CI repository-scan test timeout is increased to reflect the larger monorepo while preserving the
same scan and assertions.

## Phase result

Authenticated generation → trusted expiring draft → explicit review → learner-owned immutable study
session → server-authoritative answer evaluation.
