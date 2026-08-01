# Prompt library

Prompts are versioned product assets, not anonymous strings embedded in application code.

Each prompt specification contains an identifier, capability, owner, purpose, learner level, allowed
inputs, data classification, provider/model compatibility, output schema, examples, safety policy,
evaluation suite, token/cost budget, timeout, cache policy, version, and changelog.

## Lifecycle

Draft, evaluate offline, review, stage behind a flag, compare against guardrails, promote, monitor,
and retain a rollback version. A prompt change that can alter learner content requires the same
review discipline as code.

## Rules

- Structured outputs are mandatory where a schema can express the result.
- User content is delimited and never treated as system instruction.
- Prompts request uncertainty rather than fabricated certainty.
- Logs omit secrets and classified content.
- Cache identity includes all inputs and versions that can change the response.

Concrete prompt templates are added only with approved implementation tasks.
