# Roadmap

## Milestones

1. Repository foundation and governance
2. Product and architecture documentation
3. Design-system foundations
4. Identity, consent, and authorization
5. Database and content foundations
6. AI orchestration and evaluation infrastructure
7. Learning events, mastery, and review scheduling
8. End-to-end contextual lesson loop with offline reconciliation
9. Audio, speech, and pronunciation feedback
10. Motivation, analytics, subscriptions, reliability, and launch polish

Each milestone must prove a coherent capability and pass learning, accessibility, security,
reliability, and cost guardrails. The first detailed batch is limited to 15 tasks of approximately
2–6 hours and is created only in the roadmap/task milestone after architecture approval.

Dates, MVP scope, supported learners, commercial boundaries, and launch regions remain product-owner
decisions. Their approval is required before forecasting releases.

## MVP vertical slice

1. Capture a photo, enter words in English or another language, or provide a topic and desired word
   count (for example, “football — 30 words”).
2. Extract or generate candidates, adapt them to CEFR level, translate where needed, balance useful
   nouns, verbs, adjectives, collocations, phrasal verbs, and expressions, and resolve word senses.
3. Let the learner edit and confirm the collection.
4. Generate image/sentence challenges with four or five choices, audio, feedback, explanation, and
   five additional contexts.
5. Schedule typing, listening, speaking, reverse-direction, and mini-conversation retrieval.
6. Show retention evidence without confusing XP with mastery.

For a topic collection, the same approved vocabulary powers the complete game ecosystem: missions,
image challenges, audio challenges, dynamic sentences, explanations, contextual examples, reverse
recall, typing, speaking, mini-dialogues, stories, boss challenges, and spaced review.

## Current execution sequence

The proven local-image slice changes implementation risk, not the product destination. Continue in
this dependency order:

1. Keep local image generation operational and bounded; defer semantic image scoring.
2. Establish hybrid content, provenance, sense, and provider contracts.
3. Integrate one licensed lexical source at a time and retain unavailable facts as absent.
4. Generate and deterministically validate exercises from identified lexical senses.
5. Move session rules out of the learner UI and add resumable local persistence.
6. Complete Study/Test, navigation, feedback, error practice, audio, and reports.
7. Add mastery and versioned spaced review only after attempts are durable.
8. Add confirmed photo extraction after lexical verification is available.

This order avoids building semantic validators on provisional model output and avoids adding more
business rules to React components that will later be replaced by domain services.

## Approved initial batch proposal

The first 15 implementation tasks are indexed in [`tasks/README.md`](../tasks/README.md). The batch
first resolves open product decisions, then creates enforceable boundaries and platform scaffolds,
followed by design, data, identity, contracts, observability, AI ports, and CI hardening. No
learning feature is implemented until these foundations and the next task batch are reviewed.
