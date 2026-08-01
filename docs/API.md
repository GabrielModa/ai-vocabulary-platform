# API

The public application API is REST over HTTPS with an OpenAPI contract. Generated clients are the
supported client boundary.

## Conventions

- Resource-oriented URLs; JSON request and response bodies
- Zod validation at trust boundaries and documented error schemas
- Cursor pagination for growing collections
- ISO 8601 UTC timestamps plus explicit IANA time-zone fields where needed
- Idempotency keys for retryable writes, synchronization, webhooks, and payments
- Optimistic concurrency for user-editable and synchronizable resources
- Stable machine error codes with safe user-facing messages
- Request/correlation identifiers and documented rate-limit headers

## Versioning and compatibility

Prefer additive evolution. Breaking changes require a versioned route or negotiated contract,
migration window, telemetry, and deprecation plan. OpenAPI linting, compatibility checks, contract
tests, and authorization tests gate changes.

Endpoint inventory, schemas, authentication flows, offline sync protocol, and error catalog are
completed in the architecture milestone.

## Contract workflow

`packages/api-contract/src/spec.ts` owns the current contract. Run `pnpm contract:generate` after
changing it and commit the reviewable `openapi.json` and generated TypeScript client. The client is
framework-independent and must not import API server code.

`pnpm contract:check` verifies deterministic generation, contract lint rules, and compatibility with
the separate compatibility baseline. Removing a path, schema, or required response field fails the
check even after regeneration. Generation never overwrites the baseline. Additive evolution is
allowed; deliberate breaking changes require a versioned API and migration plan before updating the
baseline.
