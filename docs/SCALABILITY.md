# Scalability

Scale through measurement, stateless application instances, efficient queries, queues, caching,
partition-ready event data, and independently replaceable provider adapters—not premature service
extraction.

## Growth path

1. Modular monolith with PostgreSQL, Redis, object storage, and background workers
2. Read replicas, partitioning, tuned indexes, queue isolation, and CDN/media optimization
3. Extract a bounded context only when scaling, ownership, availability, or deployment evidence
   outweighs distributed-system cost

Every cache has ownership, key/version design, TTL, invalidation, privacy classification, and a
source-of-truth fallback. Capacity planning covers database connections, event volume, media,
AI/speech concurrency, cost, and regional limits. Load tests use privacy-safe synthetic data.
