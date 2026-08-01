# 019 — Add privacy-safe photo ingestion

## Goal

Create editable vocabulary candidates from a temporary learner photo without retaining raw media.

## Requirements

- Accept JPEG, PNG, or WebP references up to 10 MiB with explicit processing consent.
- Scan media before extraction and isolate both operations behind ports.
- Validate extracted candidates and always request temporary-media deletion.
- Never expose media references or extracted private text in errors.

## Files allowed

`packages/vocabulary/**`, `tasks/**`, and vocabulary documentation.

## Expected commit

`feat(vocabulary): add privacy-safe photo ingestion`
