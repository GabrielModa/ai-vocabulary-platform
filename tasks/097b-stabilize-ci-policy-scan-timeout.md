# Task 097B — Stabilize CI policy scan timeout

## Goal

Keep the repository policy scan reliable as the tracked workspace grows.

## Allowed files

- `scripts/ci-policy.test.mjs`
- `tasks/097b-stabilize-ci-policy-scan-timeout.md`

## Acceptance criteria

- The real repository scan keeps the same implementation and empty-findings assertion.
- Only that integration-style assertion receives a realistic explicit timeout.
- The full repository quality gate sequence passes.

## Evidence

The unchanged scan exceeded Vitest's default 5-second limit twice, completing at the timeout
boundary (5.023 and 5.030 seconds), while the same scan passed earlier at 4.537 seconds. A focused
run completed successfully in 6.9 seconds overall, while a 10-second budget was exhausted under
full-suite CPU and IO contention. The explicit 30-second integration-test budget preserves the same
scanner and assertions.

## Rollback

Remove the explicit timeout when the scanner is made consistently faster than the default limit.
