import { describe, expect, it } from "vitest";
import { FakeClock } from "./clock.js";

describe("FakeClock", () => {
  it("returns copies and advances deterministically", () => {
    const clock = new FakeClock("2026-08-01T12:00:00.000Z");
    const first = clock.now();
    first.setUTCFullYear(2000);
    expect(clock.now().toISOString()).toBe("2026-08-01T12:00:00.000Z");
    clock.advance(60_000);
    expect(clock.now().toISOString()).toBe("2026-08-01T12:01:00.000Z");
  });

  it("rejects invalid instants and durations", () => {
    expect(() => new FakeClock("invalid")).toThrow(TypeError);
    const clock = new FakeClock(0);
    expect(() => {
      clock.advance(Number.POSITIVE_INFINITY);
    }).toThrow(TypeError);
  });
});
