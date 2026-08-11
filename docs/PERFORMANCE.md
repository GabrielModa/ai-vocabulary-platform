# Performance

Performance budgets are user-facing requirements and must be measured on representative low- and
mid-tier devices and constrained networks.

## Initial budget categories

- App cold/warm start and time to first useful interaction
- Input response, animation frame stability, and lesson transition latency
- Web Core Web Vitals and initial JavaScript/media weight
- API p50/p95/p99 latency and error rate by operation
- AI/speech queue time, first response, completion time, and fallback rate
- Offline package size, synchronization duration, battery, memory, and data use

Exact numeric SLOs are approved with the launch audience and hosting plan. CI uses deterministic
micro-budgets where reliable; production telemetry validates real journeys. Regressions require an
owner, exception expiry, and remediation task.

## Local vocabulary benchmark

Run `pnpm benchmark:vocabulary` for the two-case smoke matrix or append `-- --extended` for five
representative CEFR cases. The JSON report contains only bounded stage latency and aggregate
fulfillment counts; it intentionally excludes topics, generated terms, definitions, examples, and
provider payloads. Results depend on local model, hardware, and warm/cold cache state and therefore
must be compared on the same machine.
