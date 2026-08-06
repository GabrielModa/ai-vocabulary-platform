# ADR-092 — Local image worker lifecycle and configurable routing

## Status

Accepted.

## Context

The web image proxy was hard-coded to `http://127.0.0.1:8765`, while `pnpm dev:local` started
PostgreSQL, Ollama, migrations, and Next.js but not the existing Python image worker. Developers
therefore received HTTP 503 responses until they launched `services/image-worker/start-worker.cmd`
in another terminal.

Visual clues are optional enrichment. Worker startup failures must not prevent vocabulary
generation, review, session creation, answering, or completion.

## Decision

`pnpm dev:local` now checks `/health`, reuses a healthy worker, otherwise starts
`image_worker.server` through the repository virtual environment, waits for readiness, forwards
`IMAGE_WORKER_URL` to Next.js, and terminates only the worker process it owns.

Both image proxy routes use shared URL resolution. The local default remains
`http://127.0.0.1:8765`.

Worker absence remains non-fatal. The existing UI fallback continues to let the learner answer while
an image is pending, rejected, failed, or unavailable.

## Consequences

One command starts the complete local product path on configured machines. External or containerized
workers can be selected without source changes. Image infrastructure remains isolated from the
authoritative study-session and answer contracts.
