# ADR-0058: Require pedagogically credible definition-choice distractors

## Status

Accepted on 2026-08-13.

## Context

The no-image MVP can publish structurally valid definition-choice exercises whose alternatives are
too easy to eliminate. Same-topic and same-POS evidence is not sufficient: `ball`, `team`, `match`
and `player` are all football nouns, but their broad semantic roles are visibly different.

## Decision

Definition-choice publication fails closed when three credible distractors are unavailable. The
deterministic selector now requires the same part of speech and, for conservatively detected
concrete roles, the same semantic role. Abstract or unclassified senses stay on the existing
deterministic ranking path.

## Consequences

- Some weak definition-choice exercises that previously published will now be omitted.
- Publication rate may temporarily decrease until a broader verified distractor pool is available.
- Correct answers from published definition-choice exercises become less vulnerable to trivial
  category elimination.
- A later task should source distractors beyond the selected learner set instead of weakening this
  gate.
