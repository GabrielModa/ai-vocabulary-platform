# Detailed architecture baseline

## System and deployment units

Learners use Expo mobile or Next.js web; operators use a separately authorized Next.js admin. All
clients call one NestJS REST API through generated OpenAPI clients. Clients never call PostgreSQL,
Redis, R2, AI, analytics, or payment providers directly.

The initial backend is a modular monolith with separate API and worker processes. The API handles
authentication, authorization, validation, and short use cases. Workers handle AI generation,
speech/media processing, notifications, analytics delivery, projections, and maintenance. They may
share a codebase but have separate commands, permissions, scaling, health checks, and failure modes.

PostgreSQL is authoritative. Redis is only cache, rate-limit, lock, and queue coordination. R2 holds
versioned media. Cross-context effects use a transactional outbox and idempotent inbox consumers.

## Dependency direction

```text
domain <- application <- adapters <- delivery/bootstrap
```

Domain contains pure entities, values, policies, and events. Application contains use cases and
ports. Adapters implement database/provider ports. HTTP, job, and CLI delivery validate input and
call use cases. Frameworks and provider SDKs never enter domain code.

## Bounded contexts

| Context          | Owns                                                       | Does not own                  |
| ---------------- | ---------------------------------------------------------- | ----------------------------- |
| Identity         | Users, sessions, consent, roles, profiles                  | Learning or billing state     |
| Content          | Lexemes, senses, contexts, media, publication versions     | Attempts or rewards           |
| Learning         | Attempts, mastery projections, review schedules            | XP and subscriptions          |
| Lessons          | Plans, packages, sessions, activity checkpoints            | Mastery computation           |
| Speech           | Submissions, jobs, derived pronunciation feedback          | General content and identity  |
| Motivation       | XP ledger, missions, achievements, streak display          | Mastery or entitlements       |
| Entitlements     | Subscriptions, purchases, grants, provider mappings        | Payment card data             |
| AI orchestration | Requests, executions, prompts, model policies, evaluations | Publication decisions         |
| Analytics        | Consent-aware events and experiments                       | Source-of-truth product state |

Contexts communicate by application contracts or versioned events and may not read one another's
tables. Shared infrastructure does not imply shared ownership. Extraction into services requires
measured scaling, regulatory, availability, ownership, or release evidence plus a migration plan.

## Data architecture

Use opaque sortable identifiers, UTC `timestamptz`, IANA time zones, database constraints, and
optimistic versions. JSON is limited to schema-versioned payloads. Migrations follow
expand/migrate/contract and include query plans, backfill checkpoints, monitoring, and roll-forward
or rollback notes.

Attempt events are immutable and unique by learner plus client-generated attempt ID. Each records
content/activity version, device and receipt time, client sequence, modality, direction, response
evidence, hints, outcome, latency, and algorithm context. Corrections append compensating events.

Mastery and schedule records are rebuildable projections containing algorithm version and last
processed event position. Projection updates serialize by learner/word and retry optimistic
conflicts. High-volume events remain partition-ready. Raw voice has separate access and the shortest
approved retention.

Outbox rows commit with domain changes. Workers claim bounded leases and deliver at least once.
Consumers write message IDs to an inbox before effects. Idempotency records bind actor, operation,
key, request hash, status, and safe response for a defined retention period.

## API and offline synchronization

Endpoints live under `/v1`; OpenAPI is the contract. Inputs use Zod validation. Growing collections
use cursor pagination. Errors expose a stable code, safe message, request ID, and safe details—never
stack traces, provider payloads, secrets, or unauthorized existence.

Better Auth establishes identity; application policies enforce consent, role, entitlement,
ownership, and action. Admin routes use a separate audience, step-up protection for sensitive
operations, and audit events.

Retryable writes require `Idempotency-Key`; key reuse with a different request hash is rejected.
Mutable resources use ETags/versions and `If-Match`.

Offline clients keep an encrypted queue. Each attempt has a stable ID and device sequence. Sync
sends bounded ordered events, client instance, last opaque cursor, and known package/algorithm
versions. The server validates and deduplicates each event independently, appends valid events, and
returns per-event results, authoritative deltas, and a new cursor. One invalid event never discards
unrelated valid events. Attempts merge by identity, never last-write-wins.

## Learning and review engine

The lesson engine presents activities; learning interprets evidence; review predicts useful timing;
motivation reacts only after verified events. Evidence is dimensioned by sense, recognition/recall,
spelling, listening, pronunciation, contextual use, direction, modality, and context family.

A pure versioned reducer converts an attempt plus previous projection into new mastery evidence.
Unhinted delayed generation and transfer to novel contexts carry more weight than recognition or
hinted success. No single activity globally masters a word.

The scheduler interface receives prior stability/difficulty, evidence, elapsed time, workload,
learner zone, and versioned parameters; it returns due interval, priority, reason, uncertainty, and
version. Random fuzzing stores its seed. Backlog planning caps overload, prioritizes high-value due
items, and interleaves modalities. Missed days never cause punitive mastery changes.

Golden histories, property tests, simulations, shadow replay, calibration, subgroup checks, and
staged experiments gate algorithm changes. Primary outcomes are delayed unhinted recall and
transfer.

## AI, speech, and media

Text, structured generation, images, speech synthesis, transcription, and pronunciation evaluation
use separate capability ports. Routing considers capability, policy, quality, availability, latency,
and cost.

Generation follows
`requested -> queued -> running -> validating -> accepted | review_required | rejected | failed`.
Each execution pins prompt, schema, provider, model, safety policy, evaluation, and sampling
versions. Workers lease requests; retries create execution attempts without duplicating the logical
request.

The pipeline authorizes purpose, minimizes data, enforces quotas, delimits untrusted input, requests
structured output, applies timeout/circuit breaker, validates schema, runs deterministic and safety
evaluations, then accepts, rejects, or requests review. Only published immutable content versions
enter lessons; raw provider output is never direct curriculum.

Uploads use scoped authorization and quarantine. Processing verifies type, checksum, dimensions,
duration, and safety before immutable publication. Short-lived signed URLs protect private media.
Pronunciation results record uncertainty and evaluator version; raw learner audio is not retained
when derived evidence is sufficient.

## Motivation architecture

XP is an append-only ledger with unique source event, rule version, amount, and reason. Balances are
projections. Achievements and missions are versioned grants with evidence. Streaks derive from
qualifying days in an explicit time zone plus transparent grace events.

Processing is idempotent. Rules do not rewrite history; corrections use adjustment entries. Rewards
cannot change mastery. No paid chance mechanics, public ranking without separate moderation review,
shaming, or unhealthy session pressure. Caps and diminishing returns reduce farming.

## Security and privacy

Internet clients, uploads, AI providers, webhooks, admins, queues, caches, and SDKs are trust
boundaries. Each crossing authenticates where relevant, authorizes object and purpose, validates
schema/size, rate limits, and emits privacy-safe telemetry.

Data classes are public, internal, confidential, and restricted. Profiles/progress require purpose,
encryption, export/deletion, and retention. Raw voice, auth secrets, and payment mappings use
separate least-privilege access and never enter logs. Analytics uses allowlisted fields and current
consent.

Controls include secure session rotation/revocation, object-level policy tests, upload quarantine,
webhook signature/timestamp/inbox checks, prompt-injection isolation, secret/dependency/container
scanning, audit events, backups, and restoration drills. Minor eligibility, consent, residency, and
legal retention remain launch blockers requiring qualified review.

## Deployment and operations

Local, preview, development, staging, and production have separate data, buckets, queues, secrets,
auth audiences, and provider projects. Production data is never copied downward.

CI produces immutable scanned artifacts promoted by digest. Canaries monitor readiness, errors,
latency, queue lag, database saturation, attempt acceptance, sync, projection lag, and provider
quality/cost. Rollback reuses a prior artifact; irreversible data changes require roll-forward.

Correlation/causation IDs cross HTTP and jobs. Structured logs exclude classified content. Metrics
cover infrastructure and domain integrity. Runbooks cover database recovery, Redis loss, backlog,
provider/storage outage, bad content publication, compromised credentials, and algorithm rollback.
SLO, RPO, RTO, regions, and cost limits remain approval decisions.

## Testing architecture

- Unit/property tests: pure domain rules, reducers, schedulers, parsing
- Application tests: orchestration, authorization, idempotency with in-memory ports
- Integration tests: disposable PostgreSQL, Redis, queues, storage, auth, provider adapters
- Contract tests: OpenAPI, generated clients, events, webhooks, AI schemas
- Component/E2E: semantics, keyboard/screen reader, offline/multi-device, identity, consent
- Non-functional: load, latency, fault injection, migration, restore, security, accessibility

Tests use fake clocks, stored seeds, synthetic data, and fixed provider fixtures. Critical matrices
cover roles/ownership/consent, duplicate/out-of-order sync, versions/upgrades, provider failures,
time zones/DST, and assistive technology. Flaky-test exceptions need owner and expiry.

## Architecture acceptance

Implementation tasks must name their owning context, ports/contracts, data classification,
idempotency behavior, offline impact, observability, migration/rollback, and required tests. No task
may introduce an unrecorded cross-context table dependency or provider SDK in domain code.

# Vocabulary collection domain

`packages/vocabulary` owns the provider-neutral collection aggregate. It represents text, topic, and
photo sources, learner ownership, CEFR A2–C2, requested topic size, source context, word sense, part
of speech, and candidate confirmation state.

AI or extraction results enter only as proposed candidates. A collection cannot become eligible for
training until the learner explicitly confirms one or more candidates. Persistence, HTTP, provider
orchestration, and training consume this domain in later vertical-slice tasks.

Typed-word ingestion separates deterministic parsing from replaceable language detection and
linguistic analysis. The parser preserves phrases and learner order, while the analyzer boundary
must return one validated result per normalized entry. Missing, reordered, additional, or invalid
results fail before reaching the collection aggregate.
