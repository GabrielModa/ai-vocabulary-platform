# Task 150 — Generalize contextual sense evidence

Replace the football-only semantic token expansion with a reusable, auditable topic-semantic
evidence model for every trusted MVP topic.

## Allowed files

- `packages/vocabulary/src/topic-semantic-evidence.ts`
- `packages/vocabulary/src/topic-semantic-evidence.test.ts`
- `packages/vocabulary/src/contextual-sense-selector.ts`
- `packages/vocabulary/src/contextual-sense-selector.test.ts`
- `packages/vocabulary/src/index.ts`
- `packages/vocabulary/src/trusted-topic-candidates.ts`
- `tasks/150-generalize-contextual-sense-evidence.md`

## Acceptance criteria

- Every trusted MVP topic and documented alias resolves to a reviewed semantic profile.
- Candidate selection and sense resolution share one canonical topic-alias resolver.
- Sense scoring uses weighted topic evidence and requires both a minimum score and a clear winning
  margin.
- Indirect senses resolve across multiple domains, including football, money, travel, and kitchen.
- Unknown topics retain conservative literal matching and never receive an invented profile.
- Ties and weak evidence remain reviewable.
- Profiles rank existing verified definitions only; they never create lexical facts.
- Repository quality gates pass.

## Product decision

The MVP uses a small versioned semantic taxonomy for its trusted topics. The taxonomy is reusable
across words and deterministic. It can later be enriched from licensed lexical relations or replaced
by a measured embedding service behind the same evidence contract.
