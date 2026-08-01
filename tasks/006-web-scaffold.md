# 006 — Scaffold the Next.js learner web app

## Goal

Create an accessible runnable web shell without product screens.

## Background

The web platform needs build, test, metadata, error boundaries, and accessibility foundations.

## Requirements

- Scaffold Next.js in `apps/web` with App Router, validated public config, global error/not-found,
  semantic placeholder, metadata, and health-compatible build.
- Add component and browser smoke tests with no external network dependency.

## Acceptance Criteria

- Development/build commands work; placeholder is keyboard and screen-reader accessible.
- No lesson, account, dashboard, or marketing implementation is present.

## BDD Scenarios

`Given` the web shell, `when` opened by keyboard or screen reader, `then` its purpose and status are
clear.

## Definition of Done

Tests, accessibility scan, docs, and gates pass.

## Dependencies

003, 004.

## Estimated Complexity / Duration

High / 5 hours.

## Files Allowed to Modify

`apps/web/**`, workspace/turbo/Playwright config, web setup docs.

## Files Forbidden to Modify

Other apps, `packages/ui` implementation, business/API features.

## Required Tests

Render, metadata, error boundary, keyboard, automated accessibility, build smoke.

## Expected Commit Message

`build(web): scaffold learner application`
