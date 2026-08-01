# API contract

This package owns the public OpenAPI document and generated TypeScript client. Application clients
consume this package and never import the API server implementation.

## Workflow

1. Change `src/spec.ts` with the API behavior.
2. Run `pnpm contract:generate` and review `openapi.json` plus `src/generated/client.ts`.
3. Run `pnpm contract:check`. It lints the contract, verifies generated files, and compares the
   candidate with `compatibility-baseline.json` to reject breaking removals.

Generated files are committed so contract changes remain visible in code review. The API platform
team owns the source, specification, compatibility policy, and generated client together. The
baseline changes only alongside an approved versioned migration; normal generation never overwrites
it.
