# ADR-068 — Study-session runtime composition

## Status

Accepted.

## Context

Task 067 added a secure HTTP adapter with injected identity, draft, and application dependencies.
The repository has concrete PostgreSQL repositories, but the Web App still has no configured Better
Auth instance and no server-side generation-draft store.

Creating fake header authentication or trusting client exercise content would violate the security
decisions from Tasks 066 and 067.

## Decision

Add a runtime composition factory that connects:

- PostgreSQL connection;
- study-session snapshot repository;
- ownership repository;
- Task 065 application;
- Task 066 ownership-aware application;
- Task 067 HTTP handlers.

Add a process-wide registry for the remaining runtime adapters: `SessionIdentityPort<Headers>` and
`StudySessionDraftPort`. A future bootstrap calls `configureStudySessionRuntime` with the concrete
Better Auth and draft implementations.

Add concrete Next.js route exports for collection POST and item GET. Until the bootstrap is
configured, both routes fail closed with a generic 503 response. They never use a subject header,
anonymous fallback identity, or client-supplied exercise content.

The PostgreSQL runtime is cached across route invocations and hot reload. Injected connections are
supported by the composition factory for tests and do not get closed by the factory.

## Consequences

The routes now exist in the Next.js application and their secure failure mode is explicit. Task 069
can introduce generation-draft persistence and Better Auth bootstrap without changing HTTP
contracts, ownership checks, or repository composition.
