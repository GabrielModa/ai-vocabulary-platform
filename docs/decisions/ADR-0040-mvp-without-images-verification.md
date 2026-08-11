# ADR-0040 — Verify the learning MVP independently of visual clues

## Status

Accepted

## Context

Local image generation is intentionally optional and substantially slower than lexical exercise
generation. The learning product must therefore be testable and useful without an image model, while
the verified lexical and exercise pipeline remains unchanged.

## Decision

Treat the no-image journey as a first-class MVP verification profile. The focused verification must
cover generation contracts, trusted draft resolution, Study/Test review, session snapshots, answer
evaluation, and the learner-facing optional-visual-clue behavior. It must not require the image
worker, enqueue image jobs, poll image status, or prefetch visual assets.

Browser automation remains supplementary to deterministic contract and integration tests. If the
browser control surface is unavailable or policy-blocked, that limitation is reported and never
replaced by an artificial success. The application server and focused HTTP flow must still be
verified independently.

## Consequences

- Learners and developers can exercise the complete pedagogical loop without waiting for images.
- Image infrastructure can evolve later without blocking lexical quality work.
- A focused command gives the no-image MVP a repeatable regression gate.
- Final visual confirmation remains a short manual checkpoint when browser automation is blocked.
