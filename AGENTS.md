# AGENTS.md

These instructions apply to every human or AI contributor in this repository.

## Mission

Build a premium, accessible English vocabulary platform that produces durable mastery through
context, retrieval practice, spacing, and adaptive difficulty. Learning effectiveness outranks
visual polish; visual polish outranks gamification.

## Operating rules

1. Work only from an approved task in `tasks/` and remain inside its allowed files.
2. Do not invent product decisions. Record unresolved choices in the relevant document.
3. Write or update tests before implementation. A feature is incomplete while a required test is
   missing or failing.
4. Keep learner mastery separate from XP, streaks, achievements, and commercial entitlements.
5. Treat learner input, AI output, uploaded media, webhooks, and offline events as untrusted.
6. Never commit secrets, personal data, production recordings, generated artifacts, or `.env`.
7. Update documentation and decision records in the same change as behavior or contracts.

## Architecture rules

- Start as a modular monolith with explicit bounded contexts. Extract a service only after a
  documented operational reason.
- Domain modules depend on ports, never directly on provider SDKs or frameworks.
- Use immutable learning events and versioned algorithms for mastery and scheduling.
- Clients consume generated OpenAPI contracts; they do not import backend implementations.
- Background work must be idempotent, observable, retryable, and safe to replay.
- Keep authorization at use-case and object boundaries, not only at routes or screens.
- Preserve offline attempts. Resolve conflicts deterministically and document ownership rules.

## Coding standards

- TypeScript strict mode is mandatory. Do not use `any` without a documented boundary reason.
- Prefer small, explicit, composable modules and meaningful names.
- No business logic in UI components, controllers, persistence models, or provider adapters.
- No magic strings, duplicated rules, dead code, commented-out code, or hidden side effects.
- Validate external input with Zod and make invalid states difficult to represent.
- Document public APIs and non-obvious tradeoffs; avoid comments that restate code.

## Testing rules

- Unit-test domain rules and deterministic algorithms.
- Integration-test databases, queues, caches, storage, authentication, and provider adapters.
- Contract-test OpenAPI schemas and generated clients.
- E2E-test critical learner and account journeys.
- Test accessibility, authorization, offline reconciliation, idempotency, migrations, and failure
  modes where applicable.
- Do not lower thresholds, skip tests, or weaken assertions to make a gate pass.

## Git workflow

- Use short-lived branches and small Conventional Commits.
- Do not mix unrelated work in a commit or pull request.
- Before every commit run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Never bypass hooks. Never rewrite shared history without explicit maintainer approval.
- Pull requests must link the approved task, explain risk, show test evidence, and describe
  rollback.

## Definition of done

A change is done only when requirements and acceptance criteria are satisfied, required tests and
documentation are present, privacy/accessibility/security impacts are addressed, observability is
adequate, migrations and rollback are safe, and all quality gates pass.

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Stop on the first failure, fix the cause, and rerun the complete sequence.
