# Architecture

## Baseline

Use a TypeScript monorepo containing Expo mobile, Next.js web/admin, a NestJS modular monolith, and
shared packages with strict ownership. PostgreSQL is the system of record; Redis is ephemeral;
object media uses R2. Background workers process expensive and retryable work.

## Dependency direction

Domain policy depends on no framework or provider SDK. Application use cases coordinate domain
ports. Adapters implement persistence, queues, AI, storage, payments, analytics, and observability.
Transport layers validate requests and invoke use cases.

## Bounded contexts

Identity, Content, Learning, Lessons, Speech, Motivation, Entitlements, AI Orchestration, and
Analytics communicate through explicit application contracts and reliable events. Shared database
infrastructure does not permit cross-context table access.

## Cross-cutting rules

OpenAPI is the external contract. Writes are idempotent where retries are possible. An outbox
publishes committed events. Correlation IDs, structured logs, metrics, and traces cross asynchronous
boundaries. Provider failures degrade gracefully.

Detailed components, runtime topology, data flows, synchronization, ownership enforcement, and
operational behavior are defined in [Detailed architecture baseline](ARCHITECTURE_DETAILED.md).
