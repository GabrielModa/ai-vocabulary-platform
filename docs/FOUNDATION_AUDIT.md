# Foundation Audit

Status: proposed foundation baseline Scope: repository and product planning only; no application
code

## Executive summary

The product direction is strong: vocabulary mastery through contextual practice, active recall,
adaptive difficulty, and spaced repetition. The proposed stack can support mobile, web, offline
learning, and a service-oriented backend. Before implementation, however, the project needs explicit
product boundaries, measurable learning outcomes, privacy rules, offline synchronization semantics,
accessibility targets, and operational budgets.

This audit turns those gaps into decisions or documented questions. Architecture documents created
in later milestones must reference these requirements.

## Requirements added by this audit

### Product and learning outcomes

- Define the initial learner segment, supported English levels, native interface languages, and
  launch regions before designing lessons.
- Establish a diagnostic baseline and measurable mastery criteria for recognition, recall, spelling,
  listening, pronunciation, and contextual use.
- Treat the learning model as versioned product logic. Record which algorithm and content version
  produced every scheduled review.
- Require pedagogical review, bias review, and age-appropriate content controls for generated
  learning material.
- Define an MVP explicitly. The first release should prove one complete learning loop before adding
  broad game, social, or content modes.
- Separate motivational rewards from mastery decisions: XP and streaks must never incorrectly mark
  vocabulary as learned.

### Users, privacy, and safety

- Decide whether minors may use the product. If so, design parental consent, age-appropriate
  defaults, data minimization, moderation, and regional compliance before account creation is
  implemented.
- Classify stored data, including voice recordings, transcripts, learning history, generated
  content, analytics identifiers, and payment records.
- Define retention and deletion periods for each data class, including backups, cached AI responses,
  logs, analytics, and derived pronunciation scores.
- Provide account export, deletion, consent withdrawal, and audit trails.
- Never use learner voice or content to train models without explicit, informed, revocable consent.

### Accessibility and localization

- Target WCAG 2.2 AA for web and equivalent platform accessibility guidance on mobile.
- Support screen readers, keyboard navigation, reduced motion, scalable text, captions/transcripts,
  color-independent feedback, and non-audio alternatives.
- Design content, UI copy, dates, pluralization, pronunciation variants, and text expansion for
  localization from the start.

### Reliability and operations

- Define service-level objectives for API availability, lesson start latency, synchronization
  success, and data durability.
- Set performance budgets for app startup, interaction latency, web page weight, API response time,
  and AI response time.
- Define recovery point and recovery time objectives; document backup restoration tests and incident
  response ownership.
- Establish cost budgets and per-user limits for AI generation, speech, storage, analytics, and
  egress.
- Define graceful degradation when AI, speech, analytics, cache, storage, or payment providers are
  unavailable.

### Offline behavior and synchronization

- Specify which lessons and assets can be downloaded, their size limits, expiration, encryption, and
  eviction policy.
- Use an append-only learning-event model for offline progress. The server remains authoritative for
  account and entitlement data; deterministic merge rules resolve progress conflicts without
  discarding attempts.
- Require idempotency keys for synchronized writes and payments.
- Define how algorithm-version changes affect pending offline reviews.

### AI system

- Put every AI provider behind capability interfaces so text, speech, image, and evaluation
  providers can be replaced independently.
- Version prompts, schemas, models, evaluation rubrics, and safety policies.
- Validate all model output with strict schemas and reject or repair invalid output before it
  reaches a learner.
- Build curated evaluation sets for factuality, level appropriateness, naturalness, pronunciation
  scoring, safety, bias, latency, and cost.
- Do not place secrets or unrestricted provider credentials in client applications.
- Cache only when privacy classification and prompt/version identity permit it.

### Security

- Perform threat modeling before authentication, payments, file upload, speech, or AI endpoints are
  implemented.
- Use least privilege, secret rotation, encryption in transit and at rest, dependency scanning,
  secret scanning, signed artifacts, rate limits, and abuse controls.
- Maintain an authorization matrix and test object-level authorization separately from
  authentication.
- Define software supply-chain controls and a vulnerability response policy.

## Architectural improvements

1. Begin as a modular monolith in NestJS, with explicit domain boundaries and an outbox for reliable
   asynchronous work. Extract services only after operational evidence justifies the cost.
2. Use a shared domain vocabulary but avoid sharing backend implementation code with clients.
   Generated OpenAPI clients and schema packages are the contract boundary.
3. Model learning attempts as immutable events and derive current mastery and review schedules from
   versioned algorithms. Keep reward state separate.
4. Add background workers for AI generation, speech processing, notifications, and analytics
   delivery rather than holding HTTP requests open.
5. Make observability part of each feature: structured logs, traces, metrics, request identifiers,
   privacy-safe diagnostics, and cost attribution.
6. Keep infrastructure provider adapters at the edges. Domain code must not import OpenAI, Stripe,
   PostHog, Sentry, Redis, or R2 SDKs directly.
7. Use feature flags and staged rollouts for learning-algorithm and AI changes, with experiment
   assignment stored independently from mastery data.

## Proposed bounded contexts

| Context          | Responsibility                                                        |
| ---------------- | --------------------------------------------------------------------- |
| Identity         | Accounts, sessions, consent, roles, and profiles                      |
| Content          | Words, senses, contexts, media, provenance, and content versions      |
| Learning         | Attempts, mastery evidence, adaptive selection, and review scheduling |
| Lessons          | Lesson composition, delivery state, and offline packages              |
| Speech           | Audio intake, transcription, pronunciation evaluation, and feedback   |
| Motivation       | XP, missions, achievements, streaks, and cosmetic rewards             |
| Entitlements     | Plans, purchases, feature access, and payment-provider mapping        |
| AI orchestration | Provider routing, prompts, schemas, caching, evaluation, and cost     |
| Analytics        | Privacy-aware product events, experiments, and learning reports       |

## Risks and mitigations

| Risk                                                 | Impact                       | Initial mitigation                                                            |
| ---------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| Scope is too large for an MVP                        | Delayed learning validation  | Ship one end-to-end learning loop first                                       |
| AI content is wrong or unsuitable                    | Learner harm and lost trust  | Schema validation, curated evaluations, review queues, provenance             |
| Pronunciation scores are unreliable or accent-biased | Unfair feedback              | Calibrated datasets, uncertainty thresholds, supportive feedback, appeal path |
| Gamification competes with learning                  | Shallow engagement           | Keep mastery independent; measure retention, not only sessions                |
| Voice and learner data create privacy exposure       | Regulatory and trust risk    | Minimize collection, short retention, encryption, consent, deletion           |
| Offline merges corrupt progress                      | Lost learning history        | Immutable events, idempotency, deterministic conflict tests                   |
| Vendor coupling                                      | Cost and migration risk      | Capability ports, adapters, versioned contracts, export paths                 |
| Monorepo complexity slows development                | Poor developer experience    | Lean root tooling, ownership boundaries, affected-task CI                     |
| AI and media costs grow unpredictably                | Unsustainable unit economics | Budgets, quotas, cache policy, cost telemetry, graceful fallback              |

## Decisions deferred before implementation

The following require product-owner approval during documentation and architecture milestones:

- Launch learner age range, CEFR levels, interface languages, and regions.
- MVP learning loop and content catalog size.
- Free versus paid boundaries and whether Stripe is needed in the MVP.
- Social features, leaderboards, and moderation scope.
- Voice-recording retention and whether raw audio is stored at all.
- Mastery metrics and target retention intervals.
- Hosting topology, regions, data residency, SLOs, and monthly cost ceiling.
- License holder/name and copyright year for the repository license.

## Foundation acceptance criteria

- Later architecture documents address every requirement in this audit.
- Unknown decisions remain visibly marked and do not become accidental defaults.
- No application feature code is created before the foundation milestones are approved.
- Every future task links requirements, tests, allowed files, and an expected commit.
