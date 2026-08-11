# Task 106 — Local photo candidate flow

## Goal

Turn a validated photo into user-confirmable vocabulary candidates using a local vision model.

## Allowed files

- `tasks/106-local-photo-candidate-flow.md`
- `docs/adr/106-local-photo-candidate-flow.md`
- `packages/ai/src/ollama-photo.ts`
- `packages/ai/src/ollama-photo.test.ts`
- `packages/ai/src/index.ts`
- `apps/web/app/api/vocabulary/photo/route.ts`
- `apps/web/app/api/vocabulary/photo/route.test.ts`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/page.test.tsx`

## Acceptance criteria

- JPEG, PNG, and WebP files up to 10 MiB are accepted with explicit consent.
- The image is sent only to the configured local Ollama vision endpoint.
- The vision output is strict, bounded, normalized, and deduplicated.
- Vision returns candidate terms only; lexical facts still pass through the existing hybrid
  pipeline.
- The existing review screen lets the learner confirm or remove every suggestion.
- Invalid, unsafe, unavailable, and malformed requests return structured errors.
- No photo bytes or paths are persisted.

## Verification

- Provider, route, and UI tests.
- Real local vision request with a safe image.
- Repository quality gates in the documented order.
