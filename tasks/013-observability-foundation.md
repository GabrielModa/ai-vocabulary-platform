# 013 — Add observability foundation

## Goal

Provide privacy-safe logs, metrics, traces, and correlation across HTTP and jobs.

## Background

Operational diagnosis must exist before feature traffic and provider calls.

## Requirements

- Define observability ports and API adapters for correlation/causation IDs and structured logs.
- Add redaction allowlist, request metrics, health telemetry, and test exporter.
- Keep Sentry/PostHog provider code at adapters and disabled by default locally.

## Acceptance Criteria

- Correlation ID returns to client and crosses a simulated job boundary.
- Secrets and classified fixture values never appear in captured telemetry.

## BDD Scenarios

`Given` a request containing a secret-like value, `when` telemetry is emitted, `then` the value is
absent and request ID remains.

## Definition of Done

Redaction/correlation/failure tests, runbook docs, and gates pass.

## Dependencies

5.

## Estimated Complexity / Duration

High / 5 hours.

## Files Allowed to Modify

API platform modules, observability package/adapter, config, tests, operations docs.

## Files Forbidden to Modify

Feature/domain logic, real production credentials, client analytics events.

## Required Tests

Correlation, redaction, exporter failure, disabled provider, metric cardinality tests.

## Expected Commit Message

`feat(platform): add observability foundation`
