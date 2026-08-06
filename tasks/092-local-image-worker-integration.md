# Task 092 — Local Image Worker Integration

## Objective

Make local visual clues available from the normal development command without making image
infrastructure a prerequisite for learning.

## Acceptance criteria

- `pnpm dev:local` checks the image worker health endpoint.
- A healthy worker already running at `IMAGE_WORKER_URL` is reused.
- Otherwise the repository Python virtual environment starts `image_worker.server`.
- The script waits for readiness and reports device information when available.
- Missing or failed image infrastructure remains non-fatal.
- Only worker processes owned by `dev:local` are stopped during shutdown.
- Next.js receives `IMAGE_WORKER_URL`.
- Both image proxy routes use shared configurable worker URL resolution.
- Default behavior remains compatible with `http://127.0.0.1:8765`.
- Focused tests, web typecheck, lint, build, MVP verification, and formatting pass.
