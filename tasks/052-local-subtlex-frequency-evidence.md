# Task 052 — Local SUBTLEX frequency evidence

## Goal

Add the first real non-lexical evidence source to candidate ranking without introducing a remote
API, runtime Python dependency, or committed dataset.

## Allowed files

- `packages/vocabulary/src/frequency.ts`
- `packages/vocabulary/src/frequency.test.ts`
- `packages/vocabulary/src/index.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `apps/web/app/api/vocabulary/generate/route.ts`
- `scripts/import-subtlex-frequency.mjs`
- `docs/adr/052-local-subtlex-frequency-evidence.md`
- `tasks/052-local-subtlex-frequency-evidence.md`

## Acceptance criteria

- A local SUBTLEX index can be imported from CSV or TSV.
- Dataset and records are validated and fail closed.
- Missing or unreadable frequency data fails soft in the web pipeline.
- English normalization is deterministic.
- Returned evidence includes count, corpus size, frequency per million, percentile, and provenance.
- Ranking receives normalized frequency evidence without importing the concrete provider.
- Ranking metadata explains the exact frequency contribution.
- Existing lexical verification, ambiguity handling, exercises, and rejection reporting remain
  compatible.
- Frequency evidence is not treated as sense verification or CEFR.
- No new package dependency, network call, React state, or database access is added.

## Local data setup

```bash
node scripts/import-subtlex-frequency.mjs \
  /path/to/subtlex-source.tsv \
  data/subtlex/index.json
```

The generated file is local data and must not be committed.

## Verification

- Focused frequency provider tests.
- Focused lexical enrichment tests.
- Web and vocabulary typecheck, lint, and build.
- Repository quality gates before commit.

## Rollback

Remove all Task 052 files and restore lexical enrichment, route, and exports to Task 051.
