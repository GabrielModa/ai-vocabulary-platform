# Decision log

Accepted decisions are immutable entries; superseding decisions link the prior entry. Detailed ADRs
may later live in `docs/decisions/`.

| ID    | Status   | Decision                                   | Rationale                                                 |
| ----- | -------- | ------------------------------------------ | --------------------------------------------------------- |
| D-001 | Accepted | Use a pnpm/Turborepo TypeScript monorepo   | Shared tooling with explicit package ownership            |
| D-002 | Accepted | Start with a NestJS modular monolith       | Lower operational complexity with extractable boundaries  |
| D-003 | Accepted | PostgreSQL is the durable source of truth  | Transactional integrity for learning and identity data    |
| D-004 | Accepted | Store immutable learning attempts          | Replayable, auditable, versioned mastery calculations     |
| D-005 | Accepted | Separate mastery from gamification         | Rewards cannot corrupt learning evidence                  |
| D-006 | Accepted | Use REST/OpenAPI as the client contract    | Explicit validation, compatibility, and generated clients |
| D-007 | Accepted | Isolate providers behind capability ports  | Limits vendor coupling and supports testing/fallback      |
| D-008 | Accepted | Limit the first task batch to 15           | Enables review before speculative task expansion          |
| D-009 | Accepted | Use transactional outbox/inbox events      | Atomic writes and idempotent at-least-once delivery       |
| D-010 | Accepted | Use client-generated immutable attempt IDs | Durable offline capture and deterministic deduplication   |
| D-011 | Accepted | Separate API and worker deployment units   | Independent permissions, scaling, and failure handling    |
| D-012 | Accepted | Use expand/migrate/contract DB changes     | Compatible deployment and recoverable migration           |
| D-013 | Accepted | Support CEFR A2–C2 initially               | Intermediate through advanced mastery                     |
| D-014 | Accepted | Use English as the initial UI language     | Immersive experience with one launch copy system          |
| D-015 | Accepted | Make captured vocabulary the MVP loop      | Personal photos/text become contextual training           |
| D-016 | Accepted | Keep 500 starter words optional            | Fast onboarding without replacing personalization         |
| D-017 | Accepted | Confirm AI candidates before collection    | Extraction, sense, and translation can be ambiguous       |
| D-018 | Accepted | Generate collections from topics and size  | A theme can become a complete personalized game ecosystem |

## Decisions required

Launch regions, mastery algorithm, raw audio retention, hosting topology, RPO/RTO/SLOs, cost
ceiling, payment timing, and social/moderation scope remain proposed or open.
