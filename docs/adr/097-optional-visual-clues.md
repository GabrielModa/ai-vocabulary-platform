# ADR 097 — Optional visual clues

## Status

Accepted.

## Context

Local image generation is optional enrichment and can take more than a minute on the target
hardware. Learners and developers need to exercise the complete study journey without making image
worker requests or waiting for visual output.

## Decision

Visual clues remain enabled by default. A versioned local preference can disable them before set
generation or during training. When disabled, the web client does not enqueue, prefetch, or poll
image jobs. It renders an explicit non-blocking status while preserving every learning interaction.

Turning the preference off during training unmounts the image component, which aborts its active
polling request. Turning it on mounts the component for the current exercise. The preference is a
presentation/runtime choice and does not change lexical content or persisted mastery data.

## Consequences

- The core flow can be tested independently of GPU and worker availability.
- Image behavior remains available and enabled by default for normal learning.
- Existing queued worker jobs are not deleted; the client simply stops polling them.
- A future account settings repository may replace local storage without changing exercise rules.
