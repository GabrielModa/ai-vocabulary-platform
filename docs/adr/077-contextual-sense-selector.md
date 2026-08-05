# ADR-077 — Contextual Sense Selector

## Status

Accepted.

## Context

Ambiguous lexical candidates currently depend on mandatory learner review. The product direction is
for AI to choose the most contextually relevant sense while lexical sources remain the authority.

## Decision

Introduce a domain-level `ContextualSenseSelectorPort` and the `selectContextualSense` policy.

The selector receives only the learner context and a closed list of verified senses. Its response is
strict and may contain only:

- `selectedSenseId`;
- bounded confidence between zero and one;
- reason codes.

The domain rejects invented sense identifiers, extra generated lexical fields, malformed output, and
invalid confidence. When exactly one selectable sense exists, the deterministic path selects it
without calling AI.

This task defines the port and policy only. It does not integrate Ollama, generation APIs, drafts,
the UI, or study sessions.

## Consequences

AI becomes a constrained contextual decision maker rather than a lexical source. The learner no
longer needs to be the primary resolver once the selector is integrated in the next task, while an
explicit correction path can remain available.
