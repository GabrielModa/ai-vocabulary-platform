# Task 105 — Server pronunciation enrichment

## Goal

Attach optional verified CMUdict pronunciations to generated review candidates.

## Allowed files

- `tasks/105-server-pronunciation-enrichment.md`
- `docs/adr/105-server-pronunciation-enrichment.md`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `apps/web/app/api/vocabulary/generate/route.ts`

## Acceptance criteria

- The server loads an optional local CMUdict JSON index.
- Verified `en-US` ARPABET variants and provenance are included in candidates.
- Missing, malformed, or unavailable pronunciation evidence fails soft and remains absent.
- Existing callers and generation remain compatible when no index exists.

## Verification

- Targeted enrichment tests.
- Repository quality gates in the documented order.
