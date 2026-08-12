# ADR 0023: Resolve senses with deterministic evidence before local AI

## Status

Accepted on 2026-08-12.

## Decision

Lexical sense selection uses two bounded stages. First, a deterministic selector compares verified
definitions with the normalized topic and a small reviewed semantic profile for trusted catalog
topics. If exactly one sense has stronger evidence, it is selected without a model call.

If ambiguity remains, the local Ollama selector may choose only among the supplied verified WordNet
sense IDs. Decisions below `0.8` confidence, malformed output, unavailable models, ties, and unknown
sense IDs remain unresolved for learner review. Generated examples run only after sense resolution.

## Consequences

- Common trusted topics are fast and do not need unnecessary model inference.
- Free-form topics can still benefit from local semantic selection.
- The model ranks verified facts but cannot invent definitions or sense identifiers.
- Manual confirmation remains the fail-closed path when contextual evidence is weak.
