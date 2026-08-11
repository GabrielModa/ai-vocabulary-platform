# Task 104 — CMUdict pronunciation provider

## Goal

Add a deterministic local pronunciation provider for verified American-English ARPABET records.

## Allowed files

- `tasks/104-cmudict-pronunciation-provider.md`
- `docs/adr/104-cmudict-pronunciation-provider.md`
- `packages/vocabulary/src/cmudict.ts`
- `packages/vocabulary/src/cmudict.test.ts`
- `packages/vocabulary/src/index.ts`

## Acceptance criteria

- A versioned local JSON index is validated before use.
- Only valid CMU ARPABET phonemes and stress markers are accepted.
- Alternate pronunciations are preserved deterministically.
- Results identify the `en-US` dialect and carry verified provenance.
- Missing words and unsupported dialects return no pronunciation.
- No IPA or Portuguese-style phonetic spelling is inferred.

## Verification

- Provider unit tests.
- Repository quality gates in the documented order.
