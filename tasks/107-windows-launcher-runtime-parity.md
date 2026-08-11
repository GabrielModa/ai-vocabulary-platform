# Task 107 — Windows launcher runtime parity

## Goal

Make the one-click Windows launcher use the same complete local runtime as `pnpm dev:local`, while
keeping visual clues optional.

## Allowed files

- `START-LEXI.ps1`
- `apps/web/src/windows-launcher.test.ts`
- `docs/decisions/ADR-0032-windows-launcher-runtime-parity.md`
- `tasks/107-windows-launcher-runtime-parity.md`

## Acceptance criteria

- The launcher delegates database readiness, migrations, local identity, Ollama, image worker, and
  web startup to the canonical `dev:local` runtime.
- A missing image venv or model does not prevent testing the vocabulary flow without visual clues.
- The browser opens only after the web application responds.
- Ctrl+C stops the runtime process owned by the launcher.
- The launcher does not start a second worker or web process itself.

## Verification

- Focused launcher contract test.
- Repository quality gates.
- Real Windows startup through the launcher.
