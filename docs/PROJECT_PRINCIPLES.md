# Project principles

## Decision order

1. Learner safety and durable learning
2. Correctness, privacy, and accessibility
3. Maintainability and operational reliability
4. User and developer experience
5. Performance and sustainable cost
6. Feature breadth

## Engineering principles

- Prefer a simple modular monolith until evidence requires distribution.
- Make boundaries explicit and dependencies point toward domain policy.
- Store facts and events; derive changeable interpretations from versioned rules.
- Automate repeatable quality checks and keep local development close to CI.
- Design failure, migration, rollback, deletion, and observability with the happy path.
- Measure before optimizing and record irreversible or cross-cutting choices.
- Build thin vertical slices; avoid foundations with no approved consumer.

## Collaboration principles

Tasks fit within one developer-day, state forbidden files, and contain testable acceptance criteria.
Reviews focus on correctness and risk rather than personal style. Unknowns are visible and assigned,
not silently converted into assumptions.
