# 007 — Scaffold the Expo mobile app

## Goal

Create a runnable iOS/Android shell with offline-ready infrastructure boundaries.

## Background

Mobile needs Expo configuration, navigation shell, accessibility, and test setup before features.

## Requirements

- Scaffold Expo/React Native in `apps/mobile` with typed config and one neutral status route.
- Add safe-area, error boundary, reduced-motion awareness, network-state port, and test setup.
- Do not generate or commit native `ios/` or `android/` projects.

## Acceptance Criteria

- Expo typecheck/build configuration works and the shell has accessible labels/touch targets.
- Offline state can be represented without implementing sync.

## BDD Scenarios

`Given` no network, `when` the shell starts, `then` it remains usable and reports offline status
accessibly.

## Definition of Done

Component/config/smoke tests, docs, and gates pass.

## Dependencies

003, 004.

## Estimated Complexity / Duration

High / 6 hours.

## Files Allowed to Modify

`apps/mobile/**`, workspace/turbo/Detox foundation, mobile setup docs.

## Files Forbidden to Modify

Native generated directories, other apps, sync or lesson implementation.

## Required Tests

Config, render, offline state, accessibility labels, reduced-motion behavior.

## Expected Commit Message

`build(mobile): scaffold Expo application`
