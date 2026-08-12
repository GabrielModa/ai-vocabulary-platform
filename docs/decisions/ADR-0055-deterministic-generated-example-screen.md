# ADR-0055: Deterministic generated-example quality screen

## Status

Accepted on 2026-08-12.

## Context

The local language model is useful for producing natural, topic-aware sentences, but it is not a
reliable authority for CEFR, lexical truth, or pedagogical quality. Structural JSON validation alone
allows examples that are too long for beginners, repeat the answer, define the word instead of
showing it in context, or provide too little retrieval evidence.

## Decision

Add a pure deterministic quality screen after schema parsing and before an example is accepted. The
screen measures sentence length, context outside the target, target occurrences, terminal
punctuation, forbidden gaps and URLs, and meta-definition patterns. Length ceilings vary by
requested CEFR level, but the result is explicitly a local heuristic rather than official CEFR
certification.

Rejected examples remain unresolved and use the existing deficit-only retry loop. Accepted examples
are never regenerated during the same operation. Each assessment exposes reason codes and a score so
later observability and editorial tooling can explain decisions.

## Consequences

- The LLM creates language but does not approve its own output.
- Beginner examples become shorter and more immediately usable.
- Retries remain focused, bounded, and cheaper than rebuilding a complete set.
- Semantic naturalness and sense correctness still require lexical evidence and future evaluation;
  this screen does not claim to prove either one.
