# Task 109 — Context-ready exercise candidates

## Goal

Resolve only high-confidence lexical senses without another AI call and keep review focused on
decisions that still require the learner.

## Allowed files

- `packages/vocabulary/src/contextual-sense-selector.ts`
- `packages/vocabulary/src/contextual-sense-selector.test.ts`
- `packages/vocabulary/src/contextual-candidate-resolution.ts`
- `packages/vocabulary/src/candidate-pipeline.ts`
- `packages/vocabulary/src/lexical-knowledge.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `apps/web/app/api/vocabulary/generate/contextual-lexical-enrichment.ts`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/page.test.tsx`
- `docs/decisions/ADR-0034-context-ready-exercise-candidates.md`
- `tasks/109-context-ready-exercise-candidates.md`

## Acceptance criteria

- A deterministic contextual selector may auto-select an ambiguous verified sense only when topic
  evidence is strong and clearly better than alternatives.
- Low-confidence or tied senses continue to require learner review.
- No additional model inference is introduced.
- The review does not display redundant confirmation status for already resolved words.
- Existing provenance and fail-closed publication rules remain intact.

## Verification

- Contextual sense selection unit tests.
- Lexical enrichment and review UI tests.
- Repository quality gates.
