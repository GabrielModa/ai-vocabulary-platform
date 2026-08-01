# Database foundation

`@vocabulary/database` owns PostgreSQL connection, transactions, migrations, health checks, and
isolated test databases. It contains no account, learning, content, reward, or payment schema.

## Commands

Run from the repository root with `DATABASE_URL` set:

```bash
pnpm --filter @vocabulary/database db:check
pnpm --filter @vocabulary/database db:generate
pnpm --filter @vocabulary/database db:migrate
```

Application startup must not silently migrate production. Deployment runs `db:migrate` as a
separate, observable step before new application instances receive traffic.

## Testing

Integration tests create a fresh in-memory PGlite instance per test. PGlite is PostgreSQL compiled
to WebAssembly, so migrations, constraints, transactions, and SQL behavior execute without sharing
state or requiring a developer-owned database. Production uses the `postgres.js` driver.

## Schema ownership

Only delivery infrastructure is present:

- `platform_outbox`: durable events committed with future domain transactions.
- `platform_inbox`: consumer/message deduplication.
- `platform_idempotency`: retry-key state scoped by actor and operation.

Context packages remain responsible for their own future tables and cannot query another context's
schema directly.
