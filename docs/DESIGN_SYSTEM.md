# Design system

## Character

Calm, premium, dark-first, responsive, and playful through motion and feedback rather than visual
clutter. The system should combine the clarity of a productivity tool with the momentum of a game.

## Foundations

- Semantic tokens for color, typography, spacing, radius, elevation, motion, and state
- Minimum WCAG 2.2 AA contrast; color is never the only carrier of meaning
- Touch targets of at least 44 by 44 CSS points/density-independent pixels
- Scalable type, reflow, keyboard focus, screen-reader names, and reduced-motion variants
- A spacing scale rather than arbitrary values; content density adapts by viewport

## Component policy

Shared components provide semantics, states, focus behavior, loading, error handling, and test
contracts. Product screens compose components but do not fork their accessibility behavior.

Each interactive component defines default, hover where applicable, focus-visible, pressed,
disabled, loading, success, warning, and error states. Motion explains state changes, stays brief,
and never blocks input or learning feedback.

## Governance

Tokens and component APIs are versioned. New variants need a documented repeated use case. Visual
regression, keyboard, screen-reader, contrast, text-scaling, and reduced-motion checks are required
before a shared component is stable.
