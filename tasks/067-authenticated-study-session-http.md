# Task 067 — Authenticated study-session HTTP adapter

## Goal

Expose secure create/read HTTP behavior without trusting client-provided exercise content.

## Acceptance criteria

- Anonymous requests return 401.
- Non-learner identities return 403.
- POST accepts only an opaque draft reference and selection metadata.
- Trusted exercise input is resolved server-side.
- New sessions return 201 and idempotent sessions return 200.
- Invalid requests return 400.
- Missing drafts and inaccessible sessions return 404.
- Conflicts return 409.
- Ownership persistence failures return 503.
- Public responses never expose answers or internal provenance.
- No fake header authentication or client-supplied exercise persistence is introduced.

## Next checkpoint

Wire Better Auth, database repositories, draft storage, and concrete Next.js route exports.
