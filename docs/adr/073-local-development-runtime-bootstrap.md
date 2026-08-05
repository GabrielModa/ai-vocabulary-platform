# ADR-073 — Local development runtime bootstrap

## Status

Accepted.

## Decision

Next.js instrumentation registers a local learner identity only when the server runs on Node.js,
`NODE_ENV` is `development`, `LOCAL_DEV_AUTH` is exactly `true`, and `LOCAL_DEV_LEARNER_ID` is
non-empty.

`pnpm dev:local` enables those variables only for its child development process. Production, CI,
preview, and ordinary startup do not receive the local identity.

The runner loads `.env.local` before resolving configuration and verifies that the configured Ollama
model is installed.

A concrete Better Auth server remains required before deployment.
