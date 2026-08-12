# Task 135 — Resolve contextual lexical senses

## Goal

Automatically select the verified lexical sense that matches the learner topic without forcing
confirmation for obvious words, while preserving manual review for genuinely ambiguous evidence.

## Allowed files

- `tasks/135-resolve-contextual-senses.md`
- `packages/vocabulary/src/contextual-sense-selector.ts`
- `packages/vocabulary/src/contextual-sense-selector.test.ts`
- `packages/vocabulary/src/contextual-candidate-resolution.ts`
- `apps/web/app/api/vocabulary/generate/route.ts`
- `apps/web/app/api/vocabulary/generate/contextual-lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/contextual-lexical-enrichment.test.ts`
- `apps/web/src/contextual-selector-runtime.test.ts`
- `docs/decisions/0023-contextual-sense-resolution.md`

## Acceptance criteria

- Trusted topic vocabulary expands to a bounded, reviewed semantic profile.
- Football resolves clear sports senses for `coach`, `penalty`, and `tackle` deterministically.
- A deterministic tie remains unresolved.
- Remaining ambiguity may use the existing local Ollama selector.
- AI selection is restricted to verified supplied sense IDs.
- AI confidence below `0.8` remains unresolved for learner review.
- The selected sense restores its matching verified example when one exists.
- Example generation runs only after contextual selection.
- Selection failure never silently chooses the first dictionary sense.

## Verification

- Directed domain and web tests.
- Real browser generation for `football`.
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
