# 010 — Establish database package and migration harness

## Goal

Create safe PostgreSQL/Drizzle infrastructure without domain tables.

## Background

Contexts need transactions, migrations, health, and test isolation before schemas.

## Requirements

- Configure Drizzle connection factory, transaction port, migration commands, health adapter, and
  test database lifecycle.
- Add only platform migration metadata and an outbox/inbox/idempotency schema if architecture review
  confirms ownership.
- Document expand/migrate/contract and rollback procedure.

## Acceptance Criteria

- Migrate up from empty and repeat safely; integration tests isolate and clean data.
- No user, learning, content, reward, or payment table exists.

## BDD Scenarios

`Given` an empty database, `when` migrations run twice, `then` schema is current without duplicate
effects.

## Definition of Done

Migration/integration tests, docs, and gates pass against PostgreSQL.

## Dependencies

003, 004, 005.

## Estimated Complexity / Duration

High / 6 hours.

## Files Allowed to Modify

`packages/database/**`, Docker/CI database setup, database docs.

## Files Forbidden to Modify

Domain schemas, learner apps, auth/provider implementation.

## Required Tests

Connect, transaction rollback, migration repeatability, health failure, test isolation.

## Expected Commit Message

`build(database): add Drizzle migration foundation`
