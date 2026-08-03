# ADR-050 — Deterministic candidate ranking

## Status

Accepted.

## Context

The verified candidate pipeline separates AI suggestions from lexical facts, but it preserves the
suggestion order. That leaves the initial model with too much influence over which words are taught.
Future frequency, CEFR, corpus, and learner-history providers need one provider-neutral place to
contribute evidence.

## Decision

Introduce a deterministic weighted ranking engine in the vocabulary domain.

The engine:

- ranks `LearningCandidate` values without modifying them;
- records an explicit contribution for every applied rule;
- uses stable candidate IDs as deterministic tie breakers;
- accepts normalized evidence instead of importing provider implementations;
- supports lexical confidence, topic relevance, learner intent, mastery, recency, frequency, and
  level alignment;
- exposes the active policy in the result.

The default policy strongly prefers verified lexical senses and learner-requested terms, while
deprioritizing unavailable, mastered, and recently practiced candidates.

## Alternatives rejected

- Ask the LLM to rank candidates: ranking would remain non-deterministic and difficult to explain.
- Add concrete providers first: provider contracts would dictate ranking architecture prematurely.
- Rank in React or the API route: business rules would be duplicated across clients.
- Hide scoring details: debugging and future pedagogical tuning would be harder.

## Consequences

Frequency, CEFR, corpus, and learner-history adapters can contribute normalized evidence without
coupling the domain to their storage or transport. The current endpoint is not migrated in this
checkpoint, so visible candidate order remains unchanged until a later integration task.

## Rollback

Remove the ranking module, its export, tests, ADR, and Task 050 document. Candidate verification and
learning artifacts remain unchanged.
