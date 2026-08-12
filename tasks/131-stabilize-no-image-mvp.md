# Task 131 — Stabilize the no-image MVP

## Status

Approved

## Goal

Provide a fast, reproducible Windows startup and final verification path for the complete learning
MVP without requiring the optional image worker.

## Acceptance criteria

- `dev:local` accepts a tested `--no-images` option and skips image-worker startup only in that
  mode.
- The standard launcher retains full-stack behavior.
- A one-click Windows no-image launcher starts the canonical runtime with visible logs.
- The no-image learner journey passes focused MVP, accessibility, HTTP, and browser verification.
- Startup and verification behavior are documented honestly.

## Allowed files

- `scripts/dev-local.mjs`
- `scripts/dev-local-options.mjs`
- `scripts/dev-local-options.test.mjs`
- `START-LEXI.ps1`
- `START-LEXI-NO-IMAGES.cmd`
- `package.json`
- `docs/verification/no-image-mvp.md`
- `tasks/131-stabilize-no-image-mvp.md`

## Verification

Run the option test, `pnpm mvp:verify`, `pnpm test:accessibility`, a real no-image launcher and
browser journey, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in order.
