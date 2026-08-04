# Task 068 — Study-session runtime composition

## Goal

Compose real study-session repositories and applications behind concrete Next.js routes.

## Acceptance criteria

- POST `/api/study-sessions` exists.
- GET `/api/study-sessions/[id]` exists.
- PostgreSQL snapshot and ownership repositories are composed.
- Task 065 and Task 066 applications are composed.
- Runtime connections are reused.
- Identity and draft adapters require explicit bootstrap registration.
- Missing bootstrap or DATABASE_URL fails closed with generic 503.
- No fake header authentication is introduced.
- No client exercise content is trusted.
- Runtime registry tests cover fail-closed behavior and singleton reuse.
- Next.js build lists both routes.

## Next checkpoint

Persist generation drafts and configure the concrete Better Auth identity bootstrap.
