import { describe, expect, it } from "vitest";

import { suggestTrustedTopicCandidates } from "./trusted-topic-candidates.js";

describe("suggestTrustedTopicCandidates", () => {
  it("resolves aliases and returns only candidate metadata", () => {
    const result = suggestTrustedTopicCandidates({ topic: "soccer", level: "B1", count: 4 });

    expect(result).toMatchObject({ catalogVersion: "2026-08-12.1", resolvedTopic: "football" });
    expect(result?.candidates).toHaveLength(4);
    expect(result?.candidates[0]).toEqual({ term: "coach", partOfSpeech: "noun", cefrHint: "B1" });
    expect(result?.candidates.every((candidate) => Object.keys(candidate).length === 3)).toBe(true);
  });

  it("ranks the requested level before adjacent levels", () => {
    const result = suggestTrustedTopicCandidates({ topic: "work", level: "B2", count: 5 });

    expect(result?.candidates.map((candidate) => candidate.cefrHint)).toEqual([
      "B2",
      "B2",
      "B2",
      "B2",
      "B1",
    ]);
  });

  it("normalizes exclusions and never returns duplicates", () => {
    const result = suggestTrustedTopicCandidates({
      topic: "FOOTBALL!",
      level: "A2",
      count: 20,
      excludedTerms: [" Ball ", "GOAL"],
    });
    const terms = result?.candidates.map((candidate) => candidate.term) ?? [];

    expect(terms).not.toContain("ball");
    expect(terms).not.toContain("goal");
    expect(new Set(terms).size).toBe(terms.length);
  });

  it("is deterministic and respects the requested bound", () => {
    const input = { topic: "travel", level: "B1" as const, count: 3 };

    expect(suggestTrustedTopicCandidates(input)).toEqual(suggestTrustedTopicCandidates(input));
    expect(suggestTrustedTopicCandidates(input)?.candidates).toHaveLength(3);
  });

  it("returns undefined for unsupported topics", () => {
    expect(
      suggestTrustedTopicCandidates({ topic: "quantum chromodynamics", level: "C2", count: 5 }),
    ).toBeUndefined();
  });
});
