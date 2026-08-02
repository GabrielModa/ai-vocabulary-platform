# Task 036 — Local queued image worker

## Goal

Turn the proven OpenVINO command into a local, cacheable background worker without exposing
unchecked images.

## Allowed files

- `.gitignore`
- `ENVIAR-PARA-GITHUB.cmd`
- `kernel.errors.txt`
- `services/image-worker/goalkeeper-test.png`
- `services/image-worker/**`
- `tasks/036-local-image-worker.md`

## Acceptance criteria

- Requests accept only bounded vocabulary fields and CEFR levels A2–C2; raw prompts are rejected.
- Stable request IDs deduplicate generation and one consumer serializes GPU work.
- Generated files remain quarantined until a separate safety checker approves them.
- Runtime, model, cache, generated, log, and test-image files are not committed.
- Health, create-job, and job-status endpoints use Python's standard library.
- Domain tests do not load the image model.

## Verification

- `python -m unittest discover services/image-worker/tests`
- Repository quality gates.

## Rollback

Delete `services/image-worker` and this task. No application route depends on the worker yet.
