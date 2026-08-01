# API

NestJS API foundation. It intentionally exposes only:

- `GET /v1/health/live`: process liveness without external dependency checks
- `GET /v1/health/ready`: readiness through a replaceable dependency probe

## Run locally

Copy `.env.example` to `.env`, provide a development-only `BETTER_AUTH_SECRET`, then run:

```bash
pnpm --filter @vocabulary/api dev
```

The API validates configuration before startup, emits or preserves a safe `x-request-id`, removes
the Express signature header, and responds to shutdown signals through Nest lifecycle hooks.

The public contract and framework-independent client are owned by `packages/api-contract`. Server
routes and the generated OpenAPI document must remain consistent; run `pnpm contract:check` before
reviewing an API change.
