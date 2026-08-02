# Task 038 — Image status and readiness repair

## Goal

Stop indefinite image placeholders and make model readiness, rejection, and failure explicit.

## Allowed files

- `services/image-worker/image_worker/domain.py`
- `services/image-worker/image_worker/openvino_engine.py`
- `services/image-worker/image_worker/server.py`
- `services/image-worker/tests/test_domain.py`
- `apps/web/app/capture-workspace.tsx`
- `tasks/038-image-status-and-readiness.md`

## Acceptance criteria

- Health distinguishes a live HTTP server from a ready model installation.
- Sensitive contexts are rejected before generation with a learner-safe status.
- The UI has explicit loading, rejected, failed, and unavailable states.
- No terminal state can render the loading message indefinitely.
- Safety model discovery accepts the supported OpenVINO XML filename variants.
- Existing learning remains usable when local images are unavailable.

## Verification

- Python domain tests.
- Web tests, focused lint, typecheck, and production build.
