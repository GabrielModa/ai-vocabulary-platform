import { describe, expect, it } from "vitest";
import { SeededRandom } from "./random.js";

describe("SeededRandom", () => {
  it("replays the same sequence for the same seed", () => {
    const first = new SeededRandom(42);
    const second = new SeededRandom(42);
    expect(Array.from({ length: 10 }, () => first.next())).toEqual(
      Array.from({ length: 10 }, () => second.next()),
    );
  });

  it("produces bounded integers and deterministic shuffles", () => {
    const first = new SeededRandom(7);
    const second = new SeededRandom(7);
    expect(
      Array.from({ length: 100 }, () => first.integer(2, 5)).every(
        (value) => value >= 2 && value <= 5,
      ),
    ).toBe(true);
    expect(second.shuffle(["listen", "speak", "type", "recall"])).toEqual(
      new SeededRandom(7).shuffle(["listen", "speak", "type", "recall"]),
    );
  });

  it("rejects invalid ranges and empty choices", () => {
    const random = new SeededRandom(1);
    expect(() => random.integer(3, 2)).toThrow(RangeError);
    expect(() => random.pick([])).toThrow(RangeError);
  });
});
