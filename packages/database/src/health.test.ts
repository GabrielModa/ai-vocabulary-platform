import { describe, expect, it } from "vitest";
import { DatabaseHealthAdapter } from "./health.js";

describe("DatabaseHealthAdapter", () => {
  it("returns down without exposing the connection failure", async () => {
    const adapter = new DatabaseHealthAdapter({
      execute: () => Promise.reject(new Error("password=secret host=private.internal")),
    });

    await expect(adapter.check()).resolves.toEqual({ status: "down" });
  });

  it("reports deterministic query latency", async () => {
    const times = [100, 112];
    const adapter = new DatabaseHealthAdapter(
      { execute: () => Promise.resolve([]) },
      () => times.shift() ?? 112,
    );

    await expect(adapter.check()).resolves.toEqual({ status: "up", latencyMs: 12 });
  });
});
