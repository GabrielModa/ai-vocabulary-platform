# 003 — Create validated configuration package

## Goal

Provide typed, fail-fast configuration without exposing secrets.

## Background

Every deployment unit needs consistent environment validation at its own boundary.

## Requirements

- Create `packages/config` with server/client schemas, parsing APIs, and safe error output.
- Prevent server-only variables from entering client bundles.
- Document extension and test patterns; keep real credentials out of fixtures.

## Acceptance Criteria

- Valid configuration is typed; missing/invalid values fail before startup.
- Errors name variables but never values.

## BDD Scenarios

`Given` a missing required secret, `when` server config loads, `then` startup fails without
revealing values.

## Definition of Done

Public API documented, tests and all gates pass.

## Dependencies

2.

## Estimated Complexity / Duration

Medium / 4 hours.

## Files Allowed to Modify

`packages/config/**`, `.env.example`, workspace dependency files, related docs.

## Files Forbidden to Modify

`apps/**`, other package source, CI secrets.

## Required Tests

Valid, missing, malformed, unknown, and client/server separation unit tests.

## Expected Commit Message

`feat(config): add validated environment configuration`
