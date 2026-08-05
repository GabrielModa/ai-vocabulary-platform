# ADR-070 — Authenticated generation and runtime bootstrap

## Status

Accepted.

## Decision

Vocabulary generation requires learner authentication. Successful generation is persisted as a
versioned learner-bound draft before public content is returned. The response includes an opaque
draft ID and expiration timestamp.

The shared study-session runtime owns the PostgreSQL draft repository, identity adapter, and session
repositories. `configureBetterAuthRuntime({ api })` accepts the concrete application's Better Auth
`auth.api` and registers the existing `BetterAuthIdentityAdapter`.

Drafts expire after 30 minutes. Persistence conflicts return 409. No subject header or
client-provided exercise content is accepted.
