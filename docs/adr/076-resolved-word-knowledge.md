# ADR-076 — Resolved Word Knowledge

## Status

Accepted.

## Decision

Introduce `resolveCandidateKnowledge`, a pure domain adapter from the existing `LearningCandidate`
contract to `WordKnowledge`.

A unique verified provider match resolves automatically with confidence `1`. A learner-confirmed
sense records learner resolution with confidence `1`. Candidates without a selected sense remain
`needs-review`.

Examples and CEFR evidence are filtered to the selected `senseId`. Frequency and pronunciation may
be retained independently. Exercise capabilities remain explicit input; this adapter never generates
an exercise.

Contextual AI sense selection is intentionally deferred to Task 077. No API, draft, UI, or
study-session behavior changes in this task.
