# ADR-0049 — Explain errors with verified lexical contrasts

## Status

Accepted

## Context

Immediate feedback identified the correct answer and definition but did not explain why a chosen
distractor differed. Asking a language model at answer time would add latency and could invent a
semantic distinction.

## Decision

Build post-attempt feedback only from the reviewed candidate set. When the chosen option is known,
contrast its verified meaning with the target meaning. If their parts of speech differ, state that
deterministic grammatical distinction. For unknown typed input, do not assign it a meaning; provide
only the verified target and an encouragement to retrieve it again.

Bound typed learner input to 200 characters and rely on React text rendering. Do not send learner
answers to AI.

## Consequences

- Wrong answers become useful semantic evidence rather than a score-only event.
- Feedback is immediate, offline-capable, and provenance-preserving.
- Nuanced same-sense explanations remain limited by verified candidate content.
- The contrast appears only after submission, preserving retrieval-first practice.
