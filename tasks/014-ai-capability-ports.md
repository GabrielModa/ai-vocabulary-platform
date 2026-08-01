# 014 — Establish AI capability ports

## Goal

Define provider-neutral AI contracts, execution metadata, and deterministic fakes.

## Background

Text, image, speech, transcription, and pronunciation require separate replaceable capabilities.

## Requirements

- Create `packages/ai` ports for each capability with typed requests/results, errors, usage,
  provenance, timeout, and cancellation.
- Add Zod output validation helpers and deterministic fakes; no network adapter or prompt content.
- Define privacy classification and cache eligibility inputs.

## Acceptance Criteria

- Consumers depend only on capability ports; invalid fake/provider output is rejected.
- Contracts preserve model/prompt/schema/policy versions and uncertainty.

## BDD Scenarios

`Given` structurally invalid generated content, `when` validation runs, `then` it is rejected before
reaching a consumer.

## Definition of Done

Contract tests, fake consumer example, docs, and gates pass.

## Dependencies

003, 004.

## Estimated Complexity / Duration

High / 5 hours.

## Files Allowed to Modify

`packages/ai/**`, package/workspace config, AI architecture docs.

## Files Forbidden to Modify

Provider SDK adapters, API keys, prompts, learner content/features.

## Required Tests

Capability typing, validation, timeout/cancel, provenance, deterministic fake, safe errors.

## Expected Commit Message

`feat(ai): define provider-neutral capability ports`
