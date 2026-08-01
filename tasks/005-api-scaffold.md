# 005 — Scaffold the NestJS API

## Goal

Create a runnable API shell with health/readiness behavior and architectural layering.

## Background

The API must exist before contracts and adapters, but business features remain forbidden.

## Requirements

- Scaffold NestJS under `apps/api` with bootstrap, config, structured request ID, and health module.
- Expose liveness and dependency-aware readiness; support graceful shutdown.
- Provide Docker development build and smoke test.

## Acceptance Criteria

- API starts from workspace command; liveness is fast and readiness reports dependency state safely.
- No domain feature endpoint or schema exists.

## BDD Scenarios

`Given` healthy dependencies, `when` readiness is requested, `then` it succeeds with a request ID.

## Definition of Done

Unit/integration/smoke tests, docs, container check, and gates pass.

## Dependencies

003, 004.

## Estimated Complexity / Duration

High / 5 hours.

## Files Allowed to Modify

`apps/api/**`, `docker/**`, workspace/turbo config, API setup docs.

## Files Forbidden to Modify

Other apps, domain schemas, auth/AI/payment implementations.

## Required Tests

Bootstrap, liveness, readiness failure, graceful shutdown, smoke test.

## Expected Commit Message

`build(api): scaffold NestJS service`
