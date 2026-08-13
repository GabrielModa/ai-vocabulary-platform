# Task 145 — Final UX/UI coherence pass

Make the single-page learning flow feel like three distinct product screens without introducing
route/state complexity before the MVP handoff.

- Add a persistent Build → Review → Practice journey indicator.
- Make the Lexi brand a real Home action instead of an inert same-page anchor.
- Use a compact stage-specific heading after generation instead of repeating the large hero.
- Explain why the primary training action is disabled directly beside the action.
- Keep review actions visible while scrolling long candidate sets.
- Improve hover, focus, responsive, reduced-motion, hierarchy, spacing, and state feedback.
- Preserve existing generation, review, sense-confirmation, study-session, and training behavior.

Product decision: do not split into separate routes yet. Generated draft and training state are
short-lived and tightly coupled; visual screens provide navigation clarity without new persistence
failure modes.
