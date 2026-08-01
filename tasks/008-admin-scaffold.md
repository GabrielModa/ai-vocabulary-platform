# 008 — Scaffold the Next.js admin app

## Goal

Create a separately deployable operator shell with deny-by-default boundaries.

## Background

Admin functionality must never share learner authorization assumptions.

## Requirements

- Scaffold `apps/admin` with separate config, route group, error handling, metadata, and
  placeholder.
- Add a deny-by-default authorization port/fake; no real login or operational screen.

## Acceptance Criteria

- Unauthenticated access to protected placeholder is denied without revealing resource details.
- Admin configuration cannot import learner-only runtime state.

## BDD Scenarios

`Given` no operator authorization, `when` a protected route is requested, `then` access is denied
and audited by a fake port.

## Definition of Done

Boundary/accessibility/build tests, docs, and gates pass.

## Dependencies

003, 004.

## Estimated Complexity / Duration

Medium / 4 hours.

## Files Allowed to Modify

`apps/admin/**`, workspace/turbo config, admin setup docs.

## Files Forbidden to Modify

Learner apps, real auth/provider code, admin product features.

## Required Tests

Deny default, render, error state, accessibility, build smoke.

## Expected Commit Message

`build(admin): scaffold operator application`
