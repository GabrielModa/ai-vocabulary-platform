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
