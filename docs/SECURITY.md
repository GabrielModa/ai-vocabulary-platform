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

## Authentication threat model and assumptions

- Better Auth is an identity adapter only; application use cases separately enforce audience,
  consent, role, entitlement, and resource ownership.
- Session cookies are signed, HTTP-only, host-only, `SameSite=Lax`, and secure outside local/test
  environments. Cross-subdomain cookies remain disabled.
- Production trusted origins are exact HTTPS origins. Wildcards, request-derived production origins,
  and options that disable CSRF/origin checks are prohibited.
- Session lifetime is seven days with rotation after one day. Revocation and step-up requirements
  will be enforced before account launch; secret rotation must preserve active-key overlap.
- Missing, malformed, expired, wrong-audience, and revoked identities are untrusted. Provider
  responses are runtime-validated before becoming application identities.
- Ownership denial uses the same public response as other sensitive-resource denials, preventing
  enumeration. Detailed policy reasons are retained only in access-controlled audit telemetry.
- Session fixation, CSRF, origin spoofing, cookie theft, replay, privilege confusion, stale consent,
  and object enumeration remain explicit test cases as adapters are composed.

The authorization matrix format is documented in `packages/auth/README.md`. No account eligibility,
minor consent, residency, or retention policy is inferred by this foundation; those remain launch
blockers requiring approval.
