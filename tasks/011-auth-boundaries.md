# 011 — Establish authentication and authorization boundaries

## Goal

Define identity adapters and deny-by-default application authorization contracts.

## Background

Authentication proves identity; use cases must separately enforce consent, role, entitlement, and
ownership.

## Requirements

- Add Better Auth adapter shell, session identity port, policy decision types, and test fakes.
- Document cookie/CSRF/session rotation assumptions and authorization matrix format.
- Implement no signup UI, provider login, or product-specific permission.

## Acceptance Criteria

- Missing/invalid identity is denied; authorization decisions require explicit context and reason.
- Domain/application tests need no Better Auth runtime.

## BDD Scenarios

`Given` an authenticated non-owner, `when` an owned-resource policy is evaluated, `then` it denies
without revealing existence.

## Definition of Done

Contract/adapter/security tests, threat-model update, docs, and gates pass.

## Dependencies

005, 010.

## Estimated Complexity / Duration

High / 6 hours.

## Files Allowed to Modify

`packages/auth/**`, minimal API composition/tests, auth/security docs.

## Files Forbidden to Modify

Client login screens, real social providers, learning/content/payment code.

## Required Tests

Anonymous, invalid, owner/non-owner, deny default, safe error, CSRF configuration tests.

## Expected Commit Message

`feat(auth): establish identity and authorization ports`
