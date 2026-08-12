import { describe, expect, it } from "vitest";

import { selectVocabularyBenchmarkCases } from "./vocabulary-benchmark-cases.js";

describe("vocabulary benchmark cases", () => {
  it("selects the expanded everyday topic coverage matrix deterministically", () => {
    expect(selectVocabularyBenchmarkCases(["--coverage"])).toEqual([
      { topic: "family", level: "A2", requestedCount: 6 },
      { topic: "shopping", level: "B1", requestedCount: 6 },
      { topic: "home", level: "B1", requestedCount: 6 },
      { topic: "environment", level: "B2", requestedCount: 6 },
      { topic: "money", level: "C1", requestedCount: 6 },
    ]);
  });

  it("keeps smoke as the default and gives coverage priority over extended", () => {
    expect(selectVocabularyBenchmarkCases([])).toHaveLength(2);
    expect(selectVocabularyBenchmarkCases(["--extended"])).toHaveLength(5);
    expect(selectVocabularyBenchmarkCases(["--extended", "--coverage"])).toHaveLength(5);
    expect(Object.isFrozen(selectVocabularyBenchmarkCases(["--coverage"]))).toBe(true);
  });
});
