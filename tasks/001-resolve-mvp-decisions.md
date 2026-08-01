# 001 — Resolve MVP product decisions

## Goal

Approve the learner segment, MVP loop, launch constraints, and measurable outcomes needed by code
tasks.

## Background

Architecture intentionally leaves audience, regions, content scope, retention, and budgets open.

## Requirements

- Facilitate and record decisions for age range, CEFR range, interface language, region, MVP loop,
  catalog target, raw-audio retention, monetization timing, learning measures, SLO and cost ceiling.
- Update decision/risk/roadmap documents; mark owners and review dates for unresolved items.

## Acceptance Criteria

- Every listed decision is accepted or explicitly deferred with owner, deadline, and blocker.
- No technical implementation is introduced.

## BDD Scenarios

`Given` an open foundation decision, `when` the decision record is reviewed, `then` its status,
rationale, owner, consequences, and review date are visible.

## Definition of Done

Documentation is approved, linked from the index, and all quality gates pass.

## Dependencies

None.

## Estimated Complexity / Duration

Medium / 3 hours.

## Files Allowed to Modify

`docs/DECISIONS.md`, `docs/RISKS.md`, `docs/ROADMAP.md`, relevant product documents.

## Files Forbidden to Modify

`apps/**`, `packages/**`, infrastructure and dependency files.

## Required Tests

Markdown formatting and link review; repository quality gates.

## Expected Commit Message

`docs: resolve initial product decisions`
