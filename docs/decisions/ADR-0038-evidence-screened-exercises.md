# ADR-0038: Evidence-screen exercises before publication

## Status

Accepted

## Context

Structural validity does not guarantee that only one option is pedagogically defensible. A local
language model also cannot be treated as the final authority for semantic uniqueness.

## Decision

After deterministic composition and before publication, screen the answer and chosen distractor
senses using verified lexical evidence. Reject direct definition cross-references, substantial
definition-token overlap, missing selected-sense evidence, and distractors already present in the
source context.

A passing result is called `evidence-screened`. It is not called semantically proven. Content that
fails the screen cannot be repaired by AI and is rejected for replacement.

## Consequences

- Detectable ambiguity is removed without another inference.
- Exercise publication remains deterministic, cheap, and explainable.
- Conservative rejection can reduce coverage; deficit replacement handles that explicitly.
- Future corpus substitution evidence may strengthen the screen without changing its boundary.
