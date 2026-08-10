# Task 096B — Align post-MVP regression tests

## Objective

Restore the full repository gate by aligning stale assertions with accepted post-MVP behavior,
without changing runtime behavior.

## Allowed files

- `apps/web/app/api/vocabulary/generate/oewn-example-enrichment.test.ts`
- `apps/web/app/page.test.tsx`
- `tasks/096b-align-post-mvp-regression-tests.md`

## Acceptance criteria

- Ambiguous candidates may load bounded examples for every trusted sense to support contextual
  resolution, but do not replace the generated example before a sense is selected.
- The study UI test verifies readiness without expecting internal session identifiers to be shown.
- Runtime source files remain unchanged.
- Focused tests and complete repository gates pass.

## Verification

- Focused OEWN enrichment and page tests.
- Repository lint, typecheck, test, and build gates.

## Rollback

Restore the previous assertions if the accepted contextual-resolution or identifier-privacy
decisions are reverted.
