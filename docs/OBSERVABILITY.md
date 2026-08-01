# Observability runbook

## Signals

The API emits privacy-safe HTTP request metrics with method, known route template, status class,
duration, request ID, and correlation ID. Health requests use the same path, so readiness and
liveness behavior can be diagnosed without recording request content.

Correlation begins with `x-request-id`. Job envelopes preserve that request ID as their correlation
and causation context. Never add request bodies, learner text, authorization headers, provider
payloads, email addresses, uploaded content, or arbitrary metadata to telemetry.

## Providers and local behavior

Provider adapters are disabled in development and tests. Sentry and PostHog keys remain optional,
and provider-specific code must stay behind the observability adapter. A failed exporter is
contained and must not fail an HTTP request or job.

## Diagnosis

1. Start with the client-visible request ID.
2. Find the matching structured signal and its correlation ID.
3. Follow job signals sharing that correlation ID and verify the causation ID at each boundary.
4. Check status-class counts and latency by known route; `unknown` groups all dynamic/unrecognized
   routes to prevent unbounded metric labels.
5. If signals are absent, verify adapter enablement and exporter health. Do not log configuration
   values while diagnosing.

## Privacy incident response

If a classified value appears in telemetry, disable the provider adapter, preserve only access and
configuration audit evidence, rotate affected credentials when applicable, and remove the unsafe
field at the allowlist boundary before re-enabling export.
