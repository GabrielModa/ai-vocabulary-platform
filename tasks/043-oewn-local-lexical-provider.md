# Task 043 — Open English WordNet local lexical provider

## Goal

Import the official Open English WordNet 2025 JSON release into a compact local index and expose it
through the provider-neutral lexical contract.

## Allowed files

- `.gitignore`
- `scripts/import-oewn.mjs`
- `packages/vocabulary/src/oewn.ts`
- `packages/vocabulary/src/oewn.test.ts`
- `packages/vocabulary/src/content.ts`
- `packages/vocabulary/src/index.ts`
- `docs/AI_SYSTEM.md`
- `tasks/043-oewn-local-lexical-provider.md`

## Acceptance criteria

- The importer consumes extracted official JSON release files, not website HTML.
- Entry senses are joined to synset definitions and word classes.
- Every result preserves the OEWN version, source identifier, CC BY 4.0 license, and attribution.
- The runtime provider performs local lookups with no network dependency.
- Missing words return no lexical facts and invalid local index records fail closed.
- Downloaded archives and generated indexes remain outside Git.

## Verification

- Focused OEWN provider tests.
- Import a small fixture or inspect the official 2025 release structure.
- Repository lint, typecheck, test, and build gates.

## Rollback

Remove the importer, adapter, export, and ignore rule. Existing generated vocabulary remains
unchanged.
