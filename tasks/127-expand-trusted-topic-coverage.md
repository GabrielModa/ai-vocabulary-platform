# Task 127 — Expand trusted topic coverage

## Status

Approved

## Goal

Extend the instant, fact-free candidate path to five additional high-frequency everyday themes.

## Acceptance criteria

- Add family, shopping, home, environment, and money topic families with stable aliases.
- Provide at least 14 deduplicated candidates per canonical topic.
- Include useful candidates across A2–C2 without choosing obscurity only to fill a level.
- Store only term, part of speech, and editorial CEFR hint; lexical facts remain provider-owned.
- Expose a read-only coverage summary for tests and diagnostics.
- Preserve deterministic ranking, exclusions, and unsupported-topic fallback.

## Allowed files

- `packages/vocabulary/src/trusted-topic-candidates.ts`
- `packages/vocabulary/src/trusted-topic-candidates.test.ts`
- `docs/decisions/ADR-0050-expand-trusted-topic-coverage.md`
- `tasks/127-expand-trusted-topic-coverage.md`

## Verification

Run the trusted-topic tests, then all repository quality gates in order.
