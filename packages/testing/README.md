# `@vocabulary/testing`

Deterministic test primitives shared across packages and applications.

```ts
import { FakeClock, SeededRandom, SequentialIdFactory } from "@vocabulary/testing";

const clock = new FakeClock("2026-08-01T12:00:00Z");
const random = new SeededRandom(42);
const ids = new SequentialIdFactory({ prefix: "attempt" });
```

Use a fake clock instead of changing global time in domain tests. Record random seeds in algorithm
fixtures so failures replay exactly. Sequential IDs are test-only and must never be used as
production identifiers.

Consumers can extend the safe Vitest defaults:

```ts
import { createVitestConfig } from "@vocabulary/testing/vitest";

export default createVitestConfig({ test: { environment: "node" } });
```
