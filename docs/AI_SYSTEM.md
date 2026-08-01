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
