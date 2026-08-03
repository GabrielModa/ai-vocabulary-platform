# Task 053 — OEWN sense-bound examples

## Goal

Replace generic generated display examples with verified OEWN examples when the selected lexical
sense has licensed examples.

## Acceptance criteria

- Examples are indexed and looked up by exact `senseId`.
- Every returned example passes the existing schema and carries verified provenance.
- Examples are requested only after a unique sense is selected.
- The first verified example replaces the generated display example.
- All verified examples remain available for later exercise construction.
- Missing, malformed, or unreadable example data fails soft.
- Ambiguous candidates never receive silently selected examples.
- No remote request, AI call, database access, or new package dependency is added.

## Local data setup

Extract the official OEWN 2025 JSON archive, then run:

```bash
node scripts/import-oewn-examples.mjs \
  /path/to/extracted-english-wordnet-2025-json \
  data/oewn/examples.json
```

The generated index is local data and must not be committed.

## Verification

- Focused OEWN example provider tests.
- Focused web enrichment tests.
- Vocabulary and web typecheck, lint, and build.
- Full repository gates before commit.
