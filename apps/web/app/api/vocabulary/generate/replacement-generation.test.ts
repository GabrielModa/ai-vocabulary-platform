import { describe, expect, it } from "vitest";
import type { LocalVocabularyRequest, LocalVocabularySet } from "@vocabulary/ai";
import type { EnrichedVocabularySet } from "./lexical-enrichment";
import { generateWithDeficitReplacement } from "./replacement-generation";

const request: LocalVocabularyRequest = {
  topic: "football",
  requestedCount: 3,
  level: "B1",
};

function generated(terms: readonly string[]): LocalVocabularySet {
  return {
    title: "Football vocabulary",
    candidates: terms.map((term) => ({
      term,
      type: "noun" as const,
      meaning: "pending",
      example: "pending",
      challenge: "pending",
    })),
  };
}

function enriched(
  value: LocalVocabularySet,
  rejectedTerms: ReadonlySet<string>,
): EnrichedVocabularySet {
  const candidates = value.candidates.map((candidate, index) => {
    const rejected = rejectedTerms.has(candidate.term);
    return {
      ...candidate,
      candidateId: `candidate:${candidate.term}:noun`,
      normalizedLemma: candidate.term,
      selectionReasons: [],
      lexicalValidationStatus: rejected ? ("unavailable" as const) : ("verified" as const),
      rank: index + 1,
      rankingScore: rejected ? 0 : 100,
      rankingContributions: [],
      qualityReport: {
        candidateId: `candidate:${candidate.term}:noun`,
        decision: rejected ? ("reject" as const) : ("accept" as const),
        exerciseReadiness: rejected ? ("unavailable" as const) : ("ready" as const),
        overallScore: rejected ? 0 : 100,
        dimensions: {
          lexicalCoverage: rejected ? 0 : 100,
          exerciseReadiness: rejected ? 0 : 100,
          exampleCoverage: rejected ? 0 : 100,
          frequencyEvidence: rejected ? 0 : 100,
          ambiguityRisk: rejected ? 100 : 0,
        },
        reasonCodes: rejected ? ["lexical-evidence-unavailable"] : ["verified-sense"],
      },
    };
  });
  const usableCount = candidates.filter(
    ({ qualityReport }) => qualityReport.decision !== "reject",
  ).length;
  return {
    ...value,
    candidates,
    candidateStrategy: "suggest-verify-select",
    rankingStrategy: "deterministic-weighted-ranking",
    qualitySummary: {
      requestedCount: candidates.length,
      evaluatedCount: candidates.length,
      acceptedCount: usableCount,
      reviewCount: 0,
      rejectedCount: candidates.length - usableCount,
      usableCount,
      deficitCount: candidates.length - usableCount,
      coveragePercentage:
        candidates.length === 0 ? 0 : Math.round((usableCount / candidates.length) * 100),
      averageScore:
        candidates.length === 0 ? 0 : Math.round((usableCount / candidates.length) * 100),
      qualityBand: usableCount === candidates.length ? "high" : "low",
    },
    rejectedCandidates: [],
    generationFulfillment: {
      status: usableCount === candidates.length ? "exact" : "partial",
      requestedCount: candidates.length,
      deliveredCount: usableCount,
      deficitCount: candidates.length - usableCount,
      attempts: 1,
    },
  };
}

describe("deficit-only vocabulary replacement", () => {
  it("preserves usable candidates and requests only the missing count", async () => {
    const requests: { count: number; excluded: readonly string[] }[] = [];
    const batches = [["corner", "unknown", "penalty"], ["referee"]];
    const result = await generateWithDeficitReplacement(request, {
      suggest: (input, options) => {
        requests.push({ count: input.requestedCount, excluded: options.excludedTerms });
        return Promise.resolve(generated(batches[requests.length - 1] ?? []));
      },
      enrich: (value) => Promise.resolve(enriched(value, new Set(["unknown"]))),
    });

    expect(requests).toEqual([
      { count: 3, excluded: [] },
      { count: 1, excluded: ["corner", "penalty", "unknown"] },
    ]);
    expect(result.candidates.map(({ term }) => term)).toEqual(["corner", "penalty", "referee"]);
    expect(result.generationFulfillment).toEqual({
      status: "exact",
      requestedCount: 3,
      deliveredCount: 3,
      deficitCount: 0,
      attempts: 2,
    });
  });

  it("stops after three attempts and reports an honest partial result", async () => {
    let calls = 0;
    const result = await generateWithDeficitReplacement(request, {
      suggest: (input) => {
        calls += 1;
        return Promise.resolve(
          generated(
            Array.from(
              { length: input.requestedCount },
              (_, index) => `unknown-${String(calls)}-${String(index)}`,
            ),
          ),
        );
      },
      enrich: (value) =>
        Promise.resolve(enriched(value, new Set(value.candidates.map(({ term }) => term)))),
    });

    expect(calls).toBe(3);
    expect(result.candidates).toHaveLength(0);
    expect(result.generationFulfillment).toMatchObject({
      status: "partial",
      requestedCount: 3,
      deliveredCount: 0,
      deficitCount: 3,
      attempts: 3,
      message:
        "We found 0 of 3 verified vocabulary candidates. Try a broader topic or a smaller set.",
    });
  });
});
