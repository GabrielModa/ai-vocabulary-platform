# Task 132 — Allow verified cross-POS definition distractors

## Status

Approved

## Goal

Prevent small, valid reviewed sets from becoming untrainable when they do not contain four words of
the same part of speech.

## Acceptance criteria

- Definition-choice selection prefers same-part-of-speech distractors.
- If that pool is insufficient, it deterministically fills the deficit with other verified resolved
  knowledge from the reviewed set.
- Cross-part-of-speech fallback receives a clear score penalty and reason code.
- Duplicate terms, senses, definitions, and the target remain excluded.
- Four verified words such as referee, coach, penalty, and tackle can publish exercises.
- Cloze distractor selection remains unchanged and strict.

## Allowed files

- `packages/vocabulary/src/definition-choice-distractor-selector.ts`
- `packages/vocabulary/src/definition-choice-distractor-selector.test.ts`
- `packages/vocabulary/src/definition-choice-composer.ts`
- `packages/vocabulary/src/definition-choice-composer.test.ts`
- `apps/web/src/reviewed-definition-choice-publication.test.ts`
- `docs/decisions/ADR-0053-definition-choice-cross-pos-fallback.md`
- `tasks/132-allow-verified-cross-pos-definition-distractors.md`

## Verification

Run the definition-choice selector and reviewed-publication tests, then `pnpm lint`,
`pnpm typecheck`, `pnpm test`, and `pnpm build` in order.
