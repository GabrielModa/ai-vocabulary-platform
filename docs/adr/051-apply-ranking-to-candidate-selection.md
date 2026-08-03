# ADR-051 — Apply ranking to candidate selection

## Status

Accepted.

## Context

ADR-050 introduced deterministic candidate ranking, but the production enrichment flow still
preserves the order returned by the local language model. As a result, lexical verification affects
facts but not which candidate appears first.

## Decision

Run the ranking engine immediately after the verified candidate pipeline and before adapting
candidates to the current web response.

The web response now exposes:

- a one-based rank;
- the total ranking score;
- named score contributions;
- the ranking strategy used.

The initial integration uses lexical confidence only. Future frequency, CEFR, corpus, and learner
history evidence can be supplied without changing the response or bypassing the domain ranker.

## Alternatives rejected

- Wait for frequency or corpus providers: model ordering would remain authoritative longer than
  necessary.
- Rank after adapting to web types: the application layer would duplicate domain mapping rules.
- Hide ranking metadata: ranking decisions would be harder to debug and explain.
- Remove unavailable candidates immediately: absence of lexical data is not proof that a learner
  request should be silently discarded.

## Consequences

Verified single-sense candidates appear before ambiguous, provisional, and unavailable candidates
under the default policy. The UI remains compatible because existing candidate fields are preserved.
Ranking metadata is additive.

## Rollback

Remove the ranking call and metadata from lexical enrichment, restore pipeline order, and remove the
Task 051 test and documentation.
