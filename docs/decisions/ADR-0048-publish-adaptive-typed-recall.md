# ADR-0048 — Publish typed recall only in adaptive review

## Status

Accepted

## Context

The mastery progression policy can recommend typed recall, but the learner UI previously exposed
only multiple-choice exercises. Local adaptive review already reconstructs per-sense projections
from immutable completed-session history.

## Decision

Attach the versioned exercise progression plan to each adaptive review item. When it selects typed
recall, replace answer options with a labeled text input. Compare answers using Unicode
normalization, case folding, whitespace normalization, and trimming. Preserve the same immediate
feedback, history event, navigation, and spaced-review update.

Generated first-time sessions remain recognition-based. Productive recall is offered only when
historical evidence meets the policy threshold.

## Consequences

- Learners encounter a real increase in retrieval difficulty as mastery grows.
- The answer is not exposed through options during typed recall.
- Refresh recovery recomputes the mode from persisted history and the adaptive-review title.
- Inflection-aware answer matching remains a future lexical capability; the current expected lemma
  comparison is intentionally strict.
