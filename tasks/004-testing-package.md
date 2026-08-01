# 004 — Create shared testing package

## Goal

Provide deterministic test utilities without coupling domain packages.

## Background

Future algorithms require fake clocks, stored randomness, safe factories, and consistent Vitest
setup.

## Requirements

- Create `packages/testing` with fake clock, seeded random helper, ID factory, and Vitest presets.
- Keep utilities framework-light and tree-shakeable; document intended test layer.

## Acceptance Criteria

- Same seed/time produces identical values across runs.
- Packages can consume presets without importing application code.

## BDD Scenarios

`Given` the same seed and clock, `when` a fixture runs twice, `then` outputs are identical.

## Definition of Done

Utilities, API docs, consumer fixture, and gates pass.

## Dependencies

2.

## Estimated Complexity / Duration

Medium / 4 hours.

## Files Allowed to Modify

`packages/testing/**`, root Vitest/workspace config, testing docs.

## Files Forbidden to Modify

`apps/**`, domain packages, production provider configuration.

## Required Tests

Determinism, isolation, invalid input, and consumer configuration tests.

## Expected Commit Message

`test: add shared deterministic testing utilities`
