# ADR-094 — Learner meaning correction without snapshot mutation

## Status

Accepted.

## Context

Automatic sense resolution removes mandatory lexical review, but a learner may still receive a valid
exercise for a different meaning from the one they intended. Rewriting the current exercise would
invalidate its prompt, answer, distractors, provenance, image, and immutable session snapshot.

## Decision

After answer feedback, exercises with multiple trusted senses expose **Wrong meaning?**.

A learner can select another trusted sense. The correction:

- does not mutate the current exercise or study-session snapshot;
- marks the current attempt as unscored;
- removes a previously awarded point when necessary;
- stores a normalized term-to-sense preference in browser storage;
- applies that preference to future generated candidates when the sense remains trusted;
- safely falls back to automatic resolution when the stored sense is stale or unavailable.

This iteration intentionally keeps the preference device-local. Server synchronization requires a
separate authenticated persistence contract.

## Consequences

Learners correct semantic intent at the moment the mismatch becomes obvious. Existing sessions
remain deterministic, while future practice on the same browser improves without reopening the
pre-study meaning-confirmation step.
