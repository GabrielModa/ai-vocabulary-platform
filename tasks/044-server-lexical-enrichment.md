# Task 044 — Server-side lexical enrichment

## Goal

Load the local OEWN index once on the server and enrich generated candidates without guessing among
ambiguous lexical senses.

## Allowed files

- `apps/web/package.json`
- `package.json`
- `apps/web/app/api/vocabulary/generate/route.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `docs/AI_SYSTEM.md`
- `tasks/044-server-lexical-enrichment.md`

## Acceptance criteria

- The OEWN index is loaded only on the server and cached after the first successful read.
- A missing or invalid local index does not break text generation.
- Exactly one word-class-compatible sense may replace a provisional generated meaning.
- Multiple compatible senses remain unresolved and never select the first sense silently.
- Every candidate exposes `verified`, `provisional`, or `unavailable` lexical validation status.
- OEWN data is not bundled into or read by the browser.
- Windows native optional packages are installed reproducibly for the supported x64 workstation.

## Verification

- Focused enrichment tests for unique, ambiguous, missing, and invalid records.
- Web typecheck and build.
- Repository quality gates.

## Rollback

Remove the enrichment service and return the existing Ollama result directly.
