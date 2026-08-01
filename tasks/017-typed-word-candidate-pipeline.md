# 017 — Add typed-word candidate pipeline

## Goal

Turn learner-entered English or multilingual word lists into validated, editable candidates.

## Requirements

- Parse comma-, semicolon-, and newline-separated terms without splitting phrases.
- Deduplicate normalized input, preserve source text/order, and reject empty, oversized, or more
  than 100 entries without silent truncation.
- Isolate language detection and candidate analysis behind provider-neutral ports.
- Validate analyzer output and create only proposed candidates in a draft collection.

## Acceptance criteria

- English and non-English lists produce deterministic draft candidates through test fakes.
- Invalid, missing, reordered, or extra analyzer results are rejected before the collection.
- No candidate is automatically confirmed and errors contain no learner text.

## Files allowed

`packages/vocabulary/**`, `tasks/**`, workspace lockfile, vocabulary architecture documentation.

## Files forbidden

Network/provider adapters, prompts, persistence, API routes, photo/topic flows, learner screens.

## Required tests

Separators/phrases, normalization/deduplication, limits, language detection, output validation,
determinism, safe errors, draft-only status.

## Expected commit

`feat(vocabulary): add typed-word candidate pipeline`
