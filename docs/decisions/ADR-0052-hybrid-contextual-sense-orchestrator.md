# ADR-0052 — Hybrid contextual sense orchestration

## Status

Accepted on 2026-08-18.

## Context

Verified lexical providers often return several legitimate senses. Requiring learner confirmation
for every ambiguous entry made obvious topic-bound choices such as football formation unnecessarily
manual. Letting a language model invent or rewrite lexical facts would create a different and more
serious correctness problem.

## Decision

Use a staged resolver:

1. Filter to official senses compatible with the proposed part of speech.
2. Select immediately when only one verified sense remains.
3. Apply deterministic reviewed topic evidence using the real topic and CEFR level.
4. If evidence is inconclusive, ask a schema-bound local model to rank only the supplied sense IDs.
5. Accept only a valid allowed ID at confidence 0.95 or higher.
6. Preserve provider definitions, examples, provenance, and attribution unchanged.
7. Keep malformed, unavailable, low-confidence, and out-of-set decisions for learner review.

The model runs with deterministic sampling and thinking disabled. It is a constrained contextual
ranker, never a lexical authority.

## Consequences

Obvious ambiguity can resolve without learner friction and the approach scales beyond manually
listed aliases. Latency is paid only after unique and deterministic paths fail. Model confidence is
not treated as proof: allowed-ID validation and the confidence threshold remain mandatory, and true
uncertainty stays visible to the learner.

The initial real smoke test justified the conservative threshold: Qwen 2.5 selected the wrong
football sense of `formation` with self-reported confidence 0.8. The deterministic first stage chose
the correct spatial sense for that case, while the AI-only result would now remain reviewable.
