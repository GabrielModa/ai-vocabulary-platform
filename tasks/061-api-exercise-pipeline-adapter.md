# Task 061 — API exercise pipeline adapter

## Goal

Attach unified exercise pipeline outcomes to verified candidates returned by the vocabulary
generation enrichment layer without blocking provisional candidates.

## Acceptance criteria

- The route remains transport-only.
- Verified candidates run through the unified domain pipeline.
- One shared verified distractor pool is used.
- Candidate order is preserved.
- Provisional and unavailable candidates remain in the API response without exercise execution.
- Candidate failures are isolated.
- Outcomes remain typed as publish, request-ai-fallback, or reject.
- No AI fallback call occurs.
- Existing candidate fields remain backward compatible.
- Inputs are not mutated.
- No database, network, randomness, or dependency is added.

## Verification

- Focused adapter tests.
- Existing lexical enrichment tests.
- Web typecheck, lint, and build.
- Full repository gates before commit.

## Next checkpoint

Version and expose the exercise pipeline outcome through the public API contract and consume publish
outcomes in the review UI.
