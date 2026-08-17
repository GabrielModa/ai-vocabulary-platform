# Task 147 — Align ambiguous-sense contract tests

Align stale server-enrichment tests with the Task 144 invariant: multiple compatible verified senses
remain provisional until explicit learner confirmation, regardless of automatic selector confidence
or deterministic topic matching.

## Allowed files

- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `apps/web/app/api/vocabulary/generate/contextual-lexical-enrichment.test.ts`
- `tasks/147-align-ambiguous-sense-contract-tests.md`

## Acceptance criteria

- Tests reject automatic authority for ambiguous same-part-of-speech senses.
- Tests verify that unconfirmed sense-bound examples are not promoted as the primary example.
- Unique verified senses remain covered by the existing auto-resolution tests.
- Repository quality gates pass.
