# Task 120 — Trusted local topic candidate pool

## Status

Approved

## Goal

Provide deterministic candidate terms for common learning topics without treating the catalog as a
source of lexical facts.

## Acceptance criteria

- Return normalized, deduplicated English terms with part of speech and a catalog CEFR hint.
- Support stable aliases for the initial common topics.
- Rank candidates by proximity to the requested CEFR level.
- Exclude already attempted terms before returning a bounded result.
- Keep meanings, definitions, examples, and exercises outside this catalog so existing trusted
  providers and validators remain authoritative.
- Return an explicit catalog version and resolved topic for provenance and cache invalidation.
- Cover topic aliases, CEFR ranking, exclusions, determinism, bounds, and unsupported topics.

## Allowed files

- `packages/vocabulary/src/index.ts`
- `packages/vocabulary/src/trusted-topic-candidates.ts`
- `packages/vocabulary/src/trusted-topic-candidates.test.ts`
- `docs/decisions/ADR-0045-trusted-topic-candidate-pool.md`
- `tasks/120-trusted-topic-candidate-pool.md`

## Verification

Run the targeted vocabulary test, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
in that order.
