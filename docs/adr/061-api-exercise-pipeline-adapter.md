# ADR-061 — API exercise pipeline adapter

## Status

Accepted.

## Context

The unified exercise pipeline is complete in the domain, while the vocabulary generation endpoint
already performs lexical, frequency, and example enrichment. Moving pedagogical decisions into the
route would duplicate policy and turn transport code into an application service.

Provisional candidates must continue to reach lexical review even when they cannot produce an
exercise.

## Decision

Add a pure adapter beside the generation endpoint.

The adapter:

- receives enriched domain candidates, optional frequency evidence, and verified examples;
- builds one shared verified distractor pool;
- runs the unified domain pipeline independently for each verified candidate;
- preserves verified-candidate order;
- omits provisional and unavailable candidates from exercise execution;
- returns typed `publish`, `request-ai-fallback`, or `reject` outcomes by candidate ID.

`enrichVocabularySet` attaches the outcome to the corresponding API candidate. The route remains a
transport boundary and continues to call one enrichment operation.

No candidate failure aborts another candidate, and no AI fallback is executed in this task.

## Alternatives rejected

- Call the domain pipeline directly in `route.ts`: leaks orchestration into transport code.
- Drop rejected candidates from the response: hides remediation information.
- Run provisional candidates: they lack a confirmed lexical sense.
- Use only the current candidate as distractor pool: cannot produce three compatible options.
- Execute AI immediately for fallback outcomes: combines policy with side effects.

## Consequences

The existing response remains backward compatible while verified candidates gain an optional typed
exercise outcome. The next checkpoint can update the API contract and UI consumption deliberately.

## Rollback

Remove the adapter, its tests, the optional candidate field, ADR, and Task 061 document.
