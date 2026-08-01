# Database

PostgreSQL is authoritative for accounts, consent, content metadata, learning events, derived
mastery, scheduling, rewards, and entitlements. Redis never holds the only copy of durable state.

## Rules

- Use UUIDv7 or another approved sortable opaque identifier; never expose sequential internal IDs.
- Store timestamps as UTC instants and time zones as IANA identifiers.
- Learning attempts are append-only; corrections use explicit compensating records.
- Derived mastery and schedules record algorithm version and source-event checkpoint.
- Every tenant/user-owned query enforces ownership and is authorization-tested.
- Migrations are reviewed, forward-safe, observable, and paired with rollback/roll-forward notes.
- Use constraints for invariants, transactions for atomic state, and an outbox for external effects.
- Encrypt classified data and keep raw audio references separate from learning history.

Schema, indexes, retention partitions, backup objectives, and context-level ownership are designed
in the architecture milestone before ORM models are created.

## Migration lifecycle

Database changes use expand/migrate/contract:

1. **Expand:** add backward-compatible nullable columns, tables, or indexes. Deploy code that can
   operate with both schemas.
2. **Migrate:** backfill in bounded, observable, restartable batches with checkpoints. Validate
   counts, constraints, latency, locks, and replica lag.
3. **Contract:** only after every deployed version stopped using the old shape, enforce final
   constraints or remove obsolete structures in a later migration.

Drizzle SQL migrations are immutable after merge. Deployment applies them once through a dedicated
job; application startup does not mutate schema. Re-running migration commands is safe because
Drizzle records applied migrations transactionally.

## Rollback and roll-forward

Application rollback reuses the previous immutable artifact while expanded schema remains
compatible. Before a destructive contract migration, take and verify a backup, document affected
queries and locks, and prepare a tested roll-forward migration. Do not reverse a migration that may
have accepted new-format data; stop writes if necessary and roll forward. Restore from backup only
under the database recovery runbook with explicit data-loss assessment.

The initial platform schema contains only shared outbox, inbox, and idempotency delivery records. It
intentionally contains no user, learning, content, reward, or payment tables.
