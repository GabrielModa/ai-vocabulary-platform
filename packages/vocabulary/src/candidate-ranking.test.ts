import { describe, expect, it } from "vitest";
import type { LearningCandidate } from "./candidate-pipeline.js";
import { defaultCandidateRankingPolicy, rankLearningCandidates } from "./candidate-ranking.js";

function candidate(
  candidateId: string,
  lexicalStatus: LearningCandidate["lexicalStatus"],
): LearningCandidate {
  return {
    candidateId,
    displayForm: candidateId,
    normalizedLemma: candidateId,
    lexicalStatus,
    availableSenses: [],
    selectionReasons: ["fixture"],
  };
}

describe("candidate ranking", () => {
  it("prioritizes verified candidates over unavailable candidates", () => {
    const result = rankLearningCandidates([
      { candidate: candidate("candidate:unknown", "unavailable") },
      { candidate: candidate("candidate:verified", "verified") },
    ]);

    expect(result.ranked.map((item) => item.candidate.candidateId)).toEqual([
      "candidate:verified",
      "candidate:unknown",
    ]);
    expect(result.ranked[0]?.contributions).toContainEqual({
      reason: "verified-sense",
      points: defaultCandidateRankingPolicy.verifiedSenseWeight,
    });
  });

  it("uses learner intent and topic relevance as explainable evidence", () => {
    const result = rankLearningCandidates([
      {
        candidate: candidate("candidate:learner", "verified"),
        evidence: { requestedByLearner: true, topicRelevance: 1 },
      },
      {
        candidate: candidate("candidate:other", "verified"),
        evidence: { topicRelevance: 0.2 },
      },
    ]);

    expect(result.ranked[0]?.candidate.candidateId).toBe("candidate:learner");
    expect(result.ranked[0]?.contributions).toEqual(
      expect.arrayContaining([
        { reason: "requested-by-learner", points: 30 },
        { reason: "topic-relevance", points: 25 },
      ]),
    );
  });

  it("deprioritizes mastered and recently practiced candidates", () => {
    const result = rankLearningCandidates([
      {
        candidate: candidate("candidate:mastered", "verified"),
        evidence: { alreadyMastered: true, recentlyPracticed: true },
      },
      { candidate: candidate("candidate:new", "verified") },
    ]);

    expect(result.ranked[0]?.candidate.candidateId).toBe("candidate:new");
    expect(result.ranked[1]?.score).toBeLessThan(result.ranked[0]?.score ?? 0);
  });

  it("accepts future frequency and level evidence without provider coupling", () => {
    const result = rankLearningCandidates([
      {
        candidate: candidate("candidate:aligned", "verified"),
        evidence: { frequencyPercentile: 0.8, levelDistance: 0 },
      },
    ]);

    expect(result.ranked[0]?.contributions).toEqual(
      expect.arrayContaining([
        { reason: "frequency-supported", points: 8 },
        { reason: "level-aligned", points: 15 },
      ]),
    );
  });

  it("clamps invalid evidence ranges deterministically", () => {
    const result = rankLearningCandidates([
      {
        candidate: candidate("candidate:bounded", "verified"),
        evidence: { topicRelevance: 4, frequencyPercentile: -2, levelDistance: 3 },
      },
    ]);

    expect(result.ranked[0]?.contributions).toEqual(
      expect.arrayContaining([
        { reason: "topic-relevance", points: 25 },
        { reason: "frequency-supported", points: 0 },
        { reason: "level-aligned", points: 0 },
      ]),
    );
  });

  it("uses candidate ID as a stable tie breaker", () => {
    const result = rankLearningCandidates([
      { candidate: candidate("candidate:zeta", "verified") },
      { candidate: candidate("candidate:alpha", "verified") },
    ]);

    expect(result.ranked.map((item) => item.candidate.candidateId)).toEqual([
      "candidate:alpha",
      "candidate:zeta",
    ]);
  });

  it("does not mutate the input order", () => {
    const inputs = [
      { candidate: candidate("candidate:zeta", "verified") },
      { candidate: candidate("candidate:alpha", "verified") },
    ] as const;

    rankLearningCandidates(inputs);

    expect(inputs.map((item) => item.candidate.candidateId)).toEqual([
      "candidate:zeta",
      "candidate:alpha",
    ]);
  });
});
