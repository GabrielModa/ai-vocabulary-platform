# 012 — Establish OpenAPI contract generation

## Goal

Generate and verify a stable API specification and typed client from the API shell.

## Background

OpenAPI is the only supported application client boundary.

## Requirements

- Generate deterministic OpenAPI for health endpoints and common error/request-ID schemas.
- Add lint, breaking-change check, and client generation into quality workflows.
- Ensure generated output is reproducible and ownership is documented.

## Acceptance Criteria

- A changed contract produces a reviewable diff; breaking change check fails intentionally.
- Client compiles without importing server implementation.

## BDD Scenarios

`Given` a required response field is removed, `when` contract checks run, `then` the breaking change
fails.

## Definition of Done

Generation/compatibility/consumer tests, docs, and gates pass.

## Dependencies

5.

## Estimated Complexity / Duration

High / 5 hours.

## Files Allowed to Modify

`apps/api/**`, a dedicated generated-contract package, scripts/CI, API docs.

## Files Forbidden to Modify

Feature endpoints, domain schemas, learner UI.

## Required Tests

Spec snapshot, lint, breaking fixture, generated-client compile, error schema contract.

## Expected Commit Message

`build(api): add OpenAPI contract pipeline`
