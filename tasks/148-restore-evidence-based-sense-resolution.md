# Task 148 — Restore evidence-based sense resolution

Remove the false-positive review flood introduced by Task 144 while preserving its protection
against model-authoritative ambiguity.

## Allowed files

- `packages/vocabulary/src/contextual-candidate-resolution.ts`
- `packages/vocabulary/src/contextual-candidate-resolution.test.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `tasks/148-restore-evidence-based-sense-resolution.md`

## Acceptance criteria

- Multiple verified senses may resolve automatically only when the deterministic context selector
  finds a unique definition-level thematic winner.
- Contextual AI selection alone never makes an ambiguous sense authoritative.
- Weak or tied evidence remains reviewable.
- The football regression covers clear terms such as `coach`, `penalty`, and `tackle`.
- Existing unique-sense and learner-confirmation behavior remains unchanged.
- MVP and repository quality gates pass.

## Product decision

Trusted deterministic evidence can remove unnecessary learner work. Model confidence cannot replace
explicit learner confirmation when verified definitions remain ambiguous.
