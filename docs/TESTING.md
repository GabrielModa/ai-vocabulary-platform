# Testing strategy

## Layers

- Unit: domain policy, algorithms, parsers, and deterministic transformations
- Integration: PostgreSQL, Redis, queues, storage, authentication, AI/speech adapters, and outbox
- Contract: OpenAPI, generated clients, provider schemas, events, and webhooks
- Component: UI behavior, semantics, keyboard, screen reader, states, and visual regression
- E2E: critical learner, offline, identity, consent, entitlement, and administration journeys
- Non-functional: performance, load, security, accessibility, recovery, and migration tests

Tests use deterministic clocks, seeded randomness, isolated data, and provider fakes at unit level.
Integration suites exercise real compatible services. Never use production personal data.

Flaky tests are defects: quarantine requires an owner and expiry. Coverage supports risk analysis
but does not replace meaningful assertions. Each task names its required tests and traceable
acceptance criteria.
