import { describe, expect, it } from "vitest";

import {
  listTrustedTopicCoverage,
  suggestTrustedTopicCandidates,
  suggestTrustedDistractorCandidates,
} from "./trusted-topic-candidates.js";

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

  it("covers twelve canonical everyday topics with useful pool depth", () => {
    const coverage = listTrustedTopicCoverage();

    expect(coverage.map(({ topic }) => topic)).toEqual([
      "education",
      "environment",
      "family",
      "football",
      "health",
      "home",
      "kitchen",
      "money",
      "shopping",
      "technology",
      "travel",
      "work",
    ]);
    expect(coverage.every(({ candidateCount }) => candidateCount >= 14)).toBe(true);
    expect(Object.isFrozen(coverage)).toBe(true);
  });

  it.each([
    ["relatives", "family"],
    ["retail", "shopping"],
    ["housing", "home"],
    ["climate", "environment"],
    ["finance", "money"],
  ])("resolves the %s alias to %s", (alias, canonical) => {
    expect(
      suggestTrustedTopicCandidates({ topic: alias, level: "B1", count: 2 })?.resolvedTopic,
    ).toBe(canonical);
  });
});

describe("suggestTrustedDistractorCandidates", () => {
  it("fills a topic-local deficit from the wider catalog and balances parts of speech", () => {
    const result = suggestTrustedDistractorCandidates({
      topic: "football",
      level: "B1",
      count: 18,
      excludedTerms: ["score", "tackle"],
    });

    expect(result.candidates).toHaveLength(18);
    const footballTerms = new Set([
      "ball",
      "team",
      "player",
      "match",
      "score",
      "goal",
      "coach",
      "referee",
      "penalty",
      "tackle",
      "substitute",
      "possession",
      "formation",
      "offside",
      "equalizer",
      "fixture",
    ]);
    expect(result.candidates.some(({ term }) => !footballTerms.has(term))).toBe(true);
    expect(
      result.candidates.filter(({ partOfSpeech }) => partOfSpeech === "verb").length,
    ).toBeGreaterThanOrEqual(4);
    expect(new Set(result.candidates.map(({ term }) => term)).size).toBe(result.candidates.length);
    expect(result).toEqual(
      suggestTrustedDistractorCandidates({
        topic: "football",
        level: "B1",
        count: 18,
        excludedTerms: ["score", "tackle"],
      }),
    );
  });
});
