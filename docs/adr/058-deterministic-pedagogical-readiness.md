# ADR-058 — Deterministic pedagogical readiness

## Status

Accepted.

## Context

Structural readiness proves that an exercise has valid IDs, provenance, one gap, and four unique
options. It does not decide whether the visible sentence provides enough context to be useful.

The system must decide when deterministic output is safe to publish and when a later fallback policy
should intervene, without pretending to prove semantic uniqueness.

## Decision

Add a conservative deterministic readiness policy after structural validation.

An exercise needs fallback when:

- structural validation fails;
- fewer than three lexical context tokens remain outside the gap;
- the answer contributes more than half of the lexical characters in the source sentence;
- any option is already visible as a complete normalized token outside the gap.

A passing result is labeled `pedagogically-ready`. Both outcomes explicitly report
`semanticUniqueness: "not-proven"`.

The policy is versioned as `deterministic-conservative-v1`, and every rejection carries measurable
evidence.

## Alternatives rejected

- Treat structural readiness as pedagogical readiness: allows context-poor exercises through.
- Ask an LLM to judge every exercise: non-deterministic, expensive, and difficult to audit.
- Claim the heuristics prove a unique answer: unsupported.
- Use sentence length alone: character counts do not reliably represent contextual information.
- Silently discard weak exercises: prevents targeted fallback and observability.

## Consequences

The deterministic pipeline can publish conservative successes and route weak items to a controlled
fallback stage. Some acceptable exercises may be rejected, which is intentional: false negatives are
safer than teaching ambiguous material.

## Rollback

Remove the readiness module, tests, export, ADR, and Task 058 document. Structural validation
remains available independently.
