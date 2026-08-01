# 002 — Enforce workspace boundaries

## Goal

Make architectural dependency rules automatically enforceable.

## Background

The modular monolith depends on preventing cycles, cross-context table access, and provider leakage.

## Requirements

- Add workspace dependency/cycle checks and documented package tags or ownership metadata.
- Add a fixture proving an invalid dependency fails and valid dependency passes.
- Integrate the check into `pnpm lint` and CI.

## Acceptance Criteria

- A forbidden dependency returns non-zero with an actionable message.
- Existing foundation remains green on all platforms supported by CI.

## BDD Scenarios

`Given` a domain package importing a provider adapter, `when` boundaries run, `then` the import is
rejected.

## Definition of Done

Tooling, fixture tests, documentation, and gates pass.

## Dependencies

1.

## Estimated Complexity / Duration

Medium / 4 hours.

## Files Allowed to Modify

Root tooling, `scripts/**`, `packages/**/package.json`, `.github/workflows/ci.yml`, testing
fixtures.

## Files Forbidden to Modify

Application source, product documents, domain business logic.

## Required Tests

Positive and negative boundary fixtures; Windows-compatible command test.

## Expected Commit Message

`build: enforce workspace boundaries`
