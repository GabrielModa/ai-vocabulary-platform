# AI system

## Capabilities

Text/content generation, IPA support, examples, stories, dialogue, explanations, images, speech
synthesis, transcription, pronunciation evaluation, and adaptive recommendations use separate
capability ports. No domain module imports a provider SDK.

## Request lifecycle

Classify data, authorize, select a versioned prompt/schema/model policy, apply safety controls,
execute with timeout and budget, validate structured output, evaluate or route uncertain content,
record privacy-safe telemetry, and cache only when classification permits.

## Reliability and safety

- Never expose provider keys to clients.
- Treat model output as untrusted and validate it before display or persistence.
- Record provider, model, prompt, schema, policy, and content versions.
- Use bounded retries, circuit breakers, queues, cost quotas, and deterministic fallbacks.
- Human review is required for flagged or high-impact content classes.
- Pronunciation evaluation communicates uncertainty and is tested for accent bias.

Provider selection, queue topology, cache keys, evaluation datasets, and budgets are architecture
decisions.

# AI system

## Capability boundaries

`packages/ai` defines separate replaceable ports for text generation, image analysis, speech
synthesis, transcription, and pronunciation assessment. Domain and application consumers depend on
these contracts rather than provider SDKs.

Each execution records model, prompt, schema, and policy versions together with usage, provenance,
and uncertainty. Requests explicitly classify privacy and cache eligibility and carry timeout and
cancellation controls. Sensitive inputs cannot be marked cache-eligible.

Provider output is untrusted and must pass the consumer-owned Zod schema before crossing into
application logic. Provider adapters and real prompts are introduced only in dedicated later tasks;
deterministic fakes support current tests without network calls.

Lexical facts, pronunciation, examples, CEFR classifications, exercises, and images use distinct
domain ports. A provider result remains `unknown` until its consumer validates the matching strict
schema. Licensed originals and generated adaptations are stored separately so attribution is never
silently transferred to modified content.

Open English WordNet integration uses the official versioned JSON release to build a local lookup
index. Runtime vocabulary lookup does not scrape HTML or require network access. OEWN identifiers,
release URL, CC BY 4.0 license, and contributor attribution remain attached to every imported sense.

Server-side enrichment may promote a generated meaning to verified only when OEWN returns exactly
one sense compatible with the generated word class. Ambiguous senses are retained for later sense
selection; the system never treats the first dictionary result as authoritative by position.

## Learner-confirmed lexical sense

When OEWN returns multiple senses compatible with a generated candidate's word class, the web review
keeps the generated meaning provisional and requires an explicit learner choice for selected items.
Definitions remain collapsed during ordinary review. A chosen OEWN sense replaces the provisional
meaning and carries its sense ID and provenance into the training candidate. Unselected ambiguous
items do not block the session.

## Pedagogical visual composition

Local images are supporting memory cues, not independent proof of an answer. The controlled prompt
requests one uncluttered educational drawing with a central observable subject or action, minimal
background detail, and no written target word. It rejects photographic composition, collages, and
unrelated decorative scenes. Concrete concepts should be easy to infer at a glance; relational or
abstract concepts may provide context but must not be presented as visually unambiguous when they
are not.
