# ADR-0056: Separate lexical quality from learning readiness

## Status

Accepted on 2026-08-12.

## Decision

Keep the existing lexical quality report and add a separate post-enrichment learning-readiness
report. The new report measures requested-count fulfillment, verified lexical coverage, contextual
example coverage, provisional example use, cloze availability, definition-choice pool availability,
and the four-question minimum required by the current session UX.

The set is `ready` when the requested set can enter training, `partial` when at least four usable
items can train but the request was not fully met, and `blocked` when fewer than four exercises can
be published. The report provides measurable counts, reason codes, and recommendations.

## Consequences

- “Good lexical candidate” no longer implies “session ready”.
- Partial success becomes visible and actionable instead of a generic failure.
- Verified and provisional examples remain distinguishable.
- The score is an operational product metric, not a claim of official CEFR certification.
