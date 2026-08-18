# ADR-0053 — Level-aware learning-set planning

## Status

Accepted — 2026-08-18

## Context

The curated candidate catalog previously sorted solely by absolute CEFR distance. When two levels
were equally distant, catalog position decided the result. A B2 request could therefore be filled
with B1 or even elementary vocabulary before equally close C1 vocabulary. The result was topically
valid but pedagogically weak: `ball`, `team`, and `player` are football words, but they do not form
a useful B2 learning set.

Candidate selection also exposed an important distinction between relevance and learning value. A
word can be strongly related to a topic while still being too familiar for the requested level.

## Decision

Curated candidate selection uses this deterministic CEFR priority:

1. requested level;
2. one level harder;
3. one level easier;
4. two levels harder;
5. two levels easier.

Catalog order remains the editorial ordering inside a level. This makes the catalog a versioned
product asset rather than an unordered bag of related words. The football B2 band is expanded to a
ten-item core covering tactical nouns, match verbs, and an evaluative adjective.

This policy applies to every curated topic. It is not a football-specific branch. Unsupported topics
continue through the schema-bound AI candidate path and lexical verification.

## Consequences

- Supported B2 requests no longer fall back to elementary words while enough B2 vocabulary exists.
- Adjacent harder vocabulary is preferred over easier filler when an exact-level band is shallow.
- Catalog quality and depth become measurable product responsibilities.
- Future catalog expansion must be benchmarked by topic, CEFR, lexical coverage, and exercise
  publication rate.
- CEFR hints remain curated planning metadata, not claims that an external authority assigned a
  definitive CEFR level.

## Rollback

Restore absolute-distance sorting and catalog version `2026-08-12.1`. No persisted learner data or
public contract requires migration.
