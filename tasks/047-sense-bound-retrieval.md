# Task 047 — Sense-bound retrieval

## Goal

Prevent a verified lexical sense from being trained or illustrated with a stale provisional sentence
that may express a different sense.

## Allowed files

- `apps/web/app/api/vocabulary/generate/lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/lexical-review.ts`
- `apps/web/app/lexical-review.test.ts`
- `apps/web/app/page.test.tsx`
- `apps/web/app/sense-bound-exercise.ts`
- `docs/AI_SYSTEM.md`
- `tasks/047-sense-bound-retrieval.md`

## Acceptance criteria

- Promoting a lexical sense invalidates the provisional cloze and creates a definition-recall
  challenge from the verified definition.
- The UI identifies definition recall separately from sentence completion.
- Image generation for definition recall uses the verified meaning instead of the stale example.
- Answer options prioritize unique candidates with the same word class before other selected terms.
- Provisional candidates retain their existing cloze behavior.
- No code claims that a natural contextual example has been verified before an example provider is
  integrated.

## Verification

- Enrichment and lexical-review unit tests.
- Web interaction test for the resolved definition-recall path.
- Typecheck, lint, and build.

## Rollback

Remove `exerciseKind` and restore the generated challenge and example as the only practice prompt.
