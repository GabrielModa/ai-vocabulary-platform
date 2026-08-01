# Decision log

Accepted decisions are immutable entries; superseding decisions link the prior entry. Detailed ADRs
may later live in `docs/decisions/`.

| ID    | Status   | Decision                                  | Rationale                                                 |
| ----- | -------- | ----------------------------------------- | --------------------------------------------------------- |
| D-001 | Accepted | Use a pnpm/Turborepo TypeScript monorepo  | Shared tooling with explicit package ownership            |
| D-002 | Accepted | Start with a NestJS modular monolith      | Lower operational complexity with extractable boundaries  |
| D-003 | Accepted | PostgreSQL is the durable source of truth | Transactional integrity for learning and identity data    |
| D-004 | Accepted | Store immutable learning attempts         | Replayable, auditable, versioned mastery calculations     |
| D-005 | Accepted | Separate mastery from gamification        | Rewards cannot corrupt learning evidence                  |
| D-006 | Accepted | Use REST/OpenAPI as the client contract   | Explicit validation, compatibility, and generated clients |
| D-007 | Accepted | Isolate providers behind capability ports | Limits vendor coupling and supports testing/fallback      |
| D-008 | Accepted | Limit the first task batch to 15          | Enables review before speculative task expansion          |

## Decisions required

Launch audience/regions, MVP scope, mastery algorithm, raw audio retention, hosting topology,
RPO/RTO/SLOs, cost ceiling, payment timing, and social/moderation scope remain proposed or open.
