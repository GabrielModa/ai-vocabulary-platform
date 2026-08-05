# ADR-086 — Reviewed Exercise Strategy Orchestrator

## Status

Accepted.

## Decision

Introduce a generic deterministic strategy orchestrator in the web application layer, beside the
review-resolution workflow that currently consumes it. Each strategy defines a stable ID, support
predicate, score, and publication operation. Verified cloze keeps score 100 and definition choice
keeps score 80.

The web application does not import a newly added symbol from the domain package's compiled `dist`
entry point, avoiding build-order coupling during local tests. The orchestrator has no Next.js,
HTTP, AI, persistence, or exercise-specific dependencies and can move to a shared package later when
the workspace supports source-level development exports.
