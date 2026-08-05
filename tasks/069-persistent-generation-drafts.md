# Task 069 — Persistent generation drafts

## Goal

Persist trusted generation results for secure study-session creation.

## Acceptance criteria

- Drafts are stored in PostgreSQL.
- Each draft belongs to one authenticated subject.
- Drafts have explicit expiry.
- Save is idempotent by draft ID.
- Missing, expired, and cross-learner drafts resolve identically.
- Title and level must match the trusted draft.
- Selected candidate IDs must exist in the trusted draft.
- The database layer stores opaque payloads and does not depend on the vocabulary domain.
- The Web adapter produces `BuildStudySessionSnapshotInput`.
- PGlite and unit tests cover persistence, expiry, ownership, and selection validation.

## Next checkpoint

Authenticate vocabulary generation, persist the trusted draft, and configure the concrete runtime
bootstrap.
