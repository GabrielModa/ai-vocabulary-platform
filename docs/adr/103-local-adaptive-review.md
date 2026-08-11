# ADR 103 — Local history as learning-engine input

## Decision

The web client maps validated completed-session events into `lexi-spacing-v1` recognition events,
replays projections, and invokes `adaptive-session-v1`. Verified sense identifiers define the
preferred knowledge identity; normalized term and part of speech are the honest fallback.

Adaptive review runs entirely from previously validated local content. It does not call Ollama,
regenerate facts, or require visual clues. The complete candidate pool remains available for
distractors while only planned terms are scored.

## Boundaries

Local device time supplies `recordedAt` until server synchronization exists, so this projection is
explicitly device-local. Voided meaning corrections are excluded from learning evidence. The UI
shows scheduling states, not global or cross-device mastery.

Learning-event identifiers allow the bounded composition of a local session identifier and a
knowledge identifier. Other knowledge and context identifiers retain their stricter limits.
