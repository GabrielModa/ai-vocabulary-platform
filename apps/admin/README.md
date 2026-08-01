# Operator application

This separately deployable Next.js application is the restricted administration boundary.

## Environment

- `ADMIN_APP_ENV`: `development`, `test`, `staging`, or `production`.
- `ADMIN_API_URL`: absolute HTTP(S) endpoint for the future operator API boundary.

Learner web and Expo public environment variables are intentionally ignored. Copy values through a
secret manager or local untracked environment file; never commit credentials.

## Current authorization behavior

Every protected request is denied by `DenyByDefaultOperatorAuthorization` and recorded by its fake
audit collection. This is a foundation seam only: there is no real identity provider, login, or
operational screen in this task.

## Local commands

```bash
ADMIN_APP_ENV=development ADMIN_API_URL=http://localhost:3001 pnpm --filter @vocabulary/admin dev
pnpm --filter @vocabulary/admin test
pnpm --filter @vocabulary/admin build
```
