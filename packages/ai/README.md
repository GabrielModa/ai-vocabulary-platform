# AI capability ports

Provider-neutral contracts for text generation, image analysis, speech synthesis, transcription, and
pronunciation assessment. Consumers depend only on these ports; provider SDKs and prompts do not
belong in this package.

Every request declares privacy classification, cache eligibility, timeout, cancellation, and the
model/prompt/schema/policy versions. Every result preserves usage, provenance, and uncertainty.
Sensitive input is never cache-eligible.

Consumers must validate provider output with `validateAiResult` before using it. Tests can use the
deterministic fake from `@vocabulary/ai/testing` without network access.

```ts
const result = await textCapability.generate(request);
const validated = validateAiResult(outputSchema, result);
return validated.value;
```
