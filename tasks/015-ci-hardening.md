# 015 — Harden CI quality and security gates

## Goal

Make the completed foundation reproducible and protected in pull requests.

## Background

As packages appear, CI must validate boundaries, contracts, migrations, accessibility, and supply
chain.

## Requirements

- Run frozen install, lint, boundaries, typecheck, unit/integration/contract tests, build, and
  relevant accessibility smoke checks.
- Add dependency, secret, and source scanning with least permissions and pinned action revisions
  policy.
- Cache safely, upload non-sensitive reports, set timeouts/concurrency, and document branch
  protection.

## Acceptance Criteria

- Intentional lint, boundary, contract, migration, or secret fixtures fail the correct gate.
- CI uses no production secret and local commands reproduce failures.

## BDD Scenarios

`Given` a pull request with a forbidden dependency, `when` CI runs, `then` merge is blocked with an
actionable failure.

## Definition of Done

Workflow validation, negative fixtures, security review, docs, and all gates pass.

## Dependencies

002–014.

## Estimated Complexity / Duration

Medium / 4 hours.

## Files Allowed to Modify

`.github/**`, root scripts/config, test fixtures, CI/security docs.

## Files Forbidden to Modify

Application/domain behavior, production secrets, unrelated product documents.

## Required Tests

Workflow syntax, local parity, negative fixtures, permissions review, secret-redaction check.

## Expected Commit Message

`ci: harden repository quality gates`
