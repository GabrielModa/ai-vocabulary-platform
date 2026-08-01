# Observability

Privacy-safe ports for structured logs, metrics, traces, and correlation. Telemetry accepts only a
small allowlist of operational fields; request bodies, learner text, tokens, headers, email
addresses, and arbitrary metadata are discarded.

Sentry and PostHog configuration is isolated behind provider adapters and disabled by default.
Exporter failures are contained so telemetry cannot break application work. Use the capturing and
failing exporters from `@vocabulary/observability/testing` in tests.
