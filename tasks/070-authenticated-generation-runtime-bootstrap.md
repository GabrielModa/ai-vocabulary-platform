# Task 070 — Authenticated generation and runtime bootstrap

## Acceptance criteria

- Anonymous generation returns 401.
- Non-learner generation returns 403.
- Learner generation persists a trusted draft before returning content.
- Response includes draft ID and expiry.
- Draft conflicts return 409.
- Generation and study-session creation share the same runtime and database connection.
- Better Auth `auth.api` is registered through the existing adapter.
- No fake authentication header is introduced.
