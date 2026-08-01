# 009 — Establish design tokens and UI package

## Goal

Create cross-platform semantic design foundations and accessible primitive contracts.

## Background

Dark-first premium UI requires shared intent without forcing web/native implementation coupling.

## Requirements

- Define versioned color, type, spacing, radius, motion, elevation, and state tokens.
- Provide web/native adapters and minimal Button/Text/Surface primitives with documented states.
- Include reduced motion, text scaling, focus, and contrast validation.

## Acceptance Criteria

- Tokens contain no screen-specific names; primitives meet contrast and touch-target requirements.
- Web and native consumers demonstrate equivalent semantics.

## BDD Scenarios

`Given` reduced motion, `when` a state changes, `then` feedback remains clear without nonessential
animation.

## Definition of Done

Visual/accessibility/unit tests, docs, examples, and gates pass.

## Dependencies

004, 006.

## Estimated Complexity / Duration

High / 6 hours.

## Files Allowed to Modify

`packages/ui/**`, minimal web/mobile consumer fixtures, design-system docs.

## Files Forbidden to Modify

Product screens, API/database/auth/AI packages.

## Required Tests

Token schema, contrast, component states, keyboard, screen-reader labels, native render.

## Expected Commit Message

`feat(ui): establish accessible design foundations`
