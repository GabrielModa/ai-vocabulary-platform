# Task 037 — Safe image cache and practice integration

## Goal

Approve model-checked local images into a durable cache and progressively show them during practice.

## Allowed files

- `START-LEXI.cmd`
- `services/image-worker/**`
- `apps/web/app/api/vocabulary/image/route.ts`
- `apps/web/app/api/vocabulary/image/[id]/route.ts`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/styles.css`
- `tasks/037-safe-image-cache-and-practice.md`

## Acceptance criteria

- The worker refuses to start generation without the model safety-checker and feature extractor.
- Requests containing disallowed content categories fail closed before generation.
- Safety-filtered black output is never approved or served.
- Only files moved into the approved cache receive a file endpoint.
- Repeated requests reuse an approved content-addressed image across restarts.
- The web application never reads local files directly and tolerates an unavailable worker.
- Practice shows an accessible loading/fallback state and progressively displays approved images.
- One Windows launcher starts both local processes and opens the application.
- Tests cover validation, rejection, approval, cache reuse, and queue failure modes.

## Verification

- `python -m unittest discover services/image-worker/tests`
- Web tests and build.

## Rollback

Remove the image API routes and visual cue component; text learning remains operational.
