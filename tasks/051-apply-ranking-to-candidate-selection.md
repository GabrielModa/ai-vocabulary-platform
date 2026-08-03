# Task 051 — Apply ranking to candidate selection

## Goal

Use deterministic domain ranking in the real server enrichment flow so the local model no longer
controls final candidate order.

## Allowed files

- `apps/web/app/api/vocabulary/generate/lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `docs/adr/051-apply-ranking-to-candidate-selection.md`
- `tasks/051-apply-ranking-to-candidate-selection.md`

## Acceptance criteria

- Verified candidates can move ahead of unavailable candidates regardless of AI suggestion order.
- Ranking occurs after lexical verification and before web adaptation.
- Every returned candidate includes rank, score, and named contributions.
- The response exposes the deterministic ranking strategy.
- Existing meanings, challenges, ambiguity behavior, rejection reporting, and provenance remain
  compatible.
- Unavailable candidates remain visible rather than being silently discarded.
- No new provider, dependency, React state, database access, or model call is added.

## Verification

- Focused lexical-enrichment tests.
- Web typecheck, lint, and build.
- Repository quality gates before commit.

## Rollback

Restore pipeline candidate order and remove ranking metadata, ADR, tests, and this task document.
