# ADR-0037: Replace only the vocabulary deficit

## Status

Accepted

## Context

The local model can suggest terms that are duplicated or absent from the verified lexical index.
Regenerating the complete set wastes inference time and can discard good candidates.

## Decision

An application-layer orchestrator preserves candidates that pass the lexical quality gate and
requests only the remaining deficit. Every term seen in previous attempts is excluded from later
prompts. The workflow is bounded to three attempts and publishes explicit fulfillment metadata.

An exhausted workflow returns the usable subset with a partial status and an honest message. It does
not invent lexical data, silently lower the requested count, or repeat the entire generation.

## Consequences

- Common replacement cases require a small additional inference instead of a full restart.
- Provider behavior remains narrow: it suggests candidates and accepts exclusions.
- Consumers can distinguish exact and partial sets deterministically.
- Lexical coverage, rather than model confidence, controls replacement.
