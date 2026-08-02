# Task 040 — Responsive image background work and Windows launcher

## Goal

Bound image waiting in the web experience, preserve safe terminal states, and start the local stack
only after its dependencies are ready.

## Allowed files

- `.gitignore`
- `eslint.config.mjs`
- `START-LEXI.cmd`
- `START-LEXI.ps1`
- `services/image-worker/**`
- `apps/web/app/api/vocabulary/image/route.ts`
- `apps/web/app/api/vocabulary/image/[id]/route.ts`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/styles.css`
- `tasks/040-image-background-and-windows-launcher.md`

## Acceptance criteria

- Public image jobs use queued, generating, approved, rejected, failed, or unavailable.
- Polling tolerates transient worker timeouts and always reaches a bounded terminal state.
- OpenVINO inference runs outside the HTTP process so health and job status remain responsive.
- Unmounted or superseded practice images stop polling.
- Image alternative text and URLs do not reveal the answer.
- Approved cache entries remain reusable across worker restarts.
- The Windows launcher validates local dependencies and ports, waits for worker health and the web
  application, reports degraded readiness, opens the browser only when ready, and supports Ctrl+C.

## Verification

- Python worker tests.
- Focused web tests, typecheck, and build.
- Real worker health, generation, approval, delivery, and cache reuse.
- Launcher preflight and startup on Windows.
