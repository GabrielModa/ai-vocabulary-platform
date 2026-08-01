import { describe, expect, it } from "vitest";
import { SequentialIdFactory } from "./id.js";

describe("SequentialIdFactory", () => {
  it("creates stable readable IDs", () => {
    const ids = new SequentialIdFactory({ prefix: "attempt", start: 12 });
    expect([ids.next(), ids.next(), ids.next("lesson")]).toEqual([
      "attempt_00000012",
      "attempt_00000013",
      "lesson_00000014",
    ]);
  });

  it("rejects unsafe starts and prefixes", () => {
    expect(() => new SequentialIdFactory({ start: -1 })).toThrow(RangeError);
    expect(() => new SequentialIdFactory().next("Invalid Prefix")).toThrow(TypeError);
  });
});
