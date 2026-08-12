# ADR-0050 — Expand the trusted candidate fast path by everyday topic

## Status

Accepted

## Context

The extended benchmark delivered 32 of 32 verified candidates in 3–41 milliseconds for the seven
existing topics. The remaining product risk is breadth: common requests outside those aliases still
pay local-model latency even though their candidate vocabulary is stable.

## Decision

Add fact-free candidate pools for family, shopping, home, environment, and money, bringing the
canonical fast path to twelve topics. Each pool contains at least fourteen useful candidates across
multiple CEFR bands. Continue storing only term, part of speech, and an editorial CEFR hint.

Expose a frozen diagnostic summary with candidate counts by level. Definitions, examples, final CEFR
classification, and exercise publication remain controlled by lexical providers and existing
validators.

## Consequences

- More common sessions avoid Ollama candidate latency.
- Coverage depth and level balance become directly testable.
- The catalog still cannot authorize a word for learning without downstream evidence.
- Future expansion should follow measured unsupported-topic demand rather than unbounded curation.
