# Security architecture

## Objectives

Protect learner identity, voice, progress, content, entitlements, and operational systems while
preserving availability and recoverability.

## Baseline controls

- Threat model authentication, authorization, sync, uploads, AI, speech, payments, and admin access.
- Use secure session cookies/tokens, rotation, revocation, CSRF protection, and rate limits.
- Enforce object-level authorization in use cases and test an explicit role/permission matrix.
- Encrypt transport and storage; manage secrets outside source control with least privilege.
- Validate file type and size, isolate processing, and use scoped signed storage access.
- Verify webhook signatures and idempotency before effects.
- Scan dependencies, secrets, containers, infrastructure, and code in CI.
- Maintain audit records for sensitive administrative and consent actions.

## Privacy

Collect the minimum data, define purpose and retention, support export/deletion, and separate raw
audio from derived learning evidence. Minor eligibility, consent, residency, and retention require
approval before accounts launch.

Incidents follow containment, preservation, notification assessment, remediation, and retrospective
steps. The private reporting process is in the root `SECURITY.md`.
