# Task 156 — Level-aware learning-set planner

## Status

Approved

## Goal

Plan curated topic sets as coherent learning collections instead of filling a requested count with
the closest catalog entries regardless of whether they are too elementary for the learner.

## Acceptance criteria

- Exact-level candidates are preferred before every adjacent level.
- When exact-level coverage is insufficient, the next-harder level is preferred before easier
  vocabulary; easier vocabulary is only a deficit fallback.
- A ten-word football B2 set excludes elementary A2 vocabulary and contains useful nouns, verbs, and
  adjectives.
- Football B2 includes tactically and contextually useful vocabulary rather than generic objects.
- Selection remains deterministic, honors exclusions, and does not call AI for supported topics.
- Catalog coverage and the selection policy are documented and versioned.
- Repository quality gates pass.

## Allowed files

- `packages/vocabulary/src/trusted-topic-candidates.ts`
- `packages/vocabulary/src/trusted-topic-candidates.test.ts`
- `apps/web/app/api/vocabulary/generate/candidate-suggestion.test.ts`
- `docs/decisions/ADR-0053-level-aware-learning-set-planning.md`
- `tasks/156-level-aware-learning-set-planner.md`

## Product decision

For curated topics, usefulness at the requested level outranks filling a set with familiar but
under-level words. The catalog remains an explicit, versioned product asset; unsupported topics
continue through the verified AI fallback.
