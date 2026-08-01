# Deployment

Local development uses Docker Compose for PostgreSQL and Redis. Application images and cloud
infrastructure are intentionally absent until architecture approval.

## Required production properties

- Immutable, minimal, non-root images with health/readiness checks
- Managed PostgreSQL with point-in-time recovery and tested restoration
- Durable queues/outbox processing and Redis configured as non-authoritative
- Private networking, managed secrets, TLS, least privilege, and protected administration
- R2/CDN lifecycle controls for media and regional/privacy requirements
- Zero- or low-downtime migrations with expand/contract compatibility
- Central logs, metrics, traces, alerts, cost telemetry, and incident runbooks

Hosting regions, providers, RPO/RTO, SLOs, scaling thresholds, and disaster-recovery exercises are
decided in the architecture milestone.
