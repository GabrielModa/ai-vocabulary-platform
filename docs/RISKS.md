# Risk register

| Risk                                      | Probability | Impact   | Mitigation                                           | Trigger/owner                           |
| ----------------------------------------- | ----------- | -------- | ---------------------------------------------------- | --------------------------------------- |
| MVP scope expands before retention proof  | High        | High     | Approve one complete learning loop                   | Product owner at roadmap approval       |
| Generated content is inaccurate or unsafe | Medium      | High     | Schemas, evaluations, provenance, review             | AI/content owner before learner display |
| Pronunciation scoring is accent-biased    | Medium      | High     | Representative evaluation and uncertainty            | Learning/speech owner before launch     |
| Voice or minor data is mishandled         | Medium      | Critical | Minimize, consent, retention, deletion, threat model | Security/privacy owner before accounts  |
| Offline sync loses or duplicates progress | Medium      | High     | Immutable events, idempotency, conflict tests        | Learning owner before offline beta      |
| Rewards displace learning                 | Medium      | High     | Separate state and retention guardrails              | Product owner per experiment            |
| AI/media cost becomes unsustainable       | High        | High     | Budgets, quotas, caching, cost attribution           | Platform owner at capacity reviews      |
| Vendor outage blocks sessions             | Medium      | Medium   | Downloaded content, queues, fallbacks                | Platform owner during game days         |
| Monorepo becomes tightly coupled          | Medium      | Medium   | Ownership rules and contract boundaries              | Architecture review per new dependency  |
| Accessibility is deferred                 | Medium      | High     | Component gates and E2E journeys                     | Design/QA owner each milestone          |

Review the register at milestone planning, after incidents, and before launch. Every high/critical
risk needs a named owner, measurable control, and evidence before exposure.
