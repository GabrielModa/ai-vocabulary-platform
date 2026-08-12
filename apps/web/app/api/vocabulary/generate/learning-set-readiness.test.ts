import { describe, expect, it } from "vitest";
import type { EnrichedCandidate } from "./lexical-enrichment";
import { evaluateLearningSetReadiness } from "./learning-set-readiness";

function candidate(
  index: number,
  options: { example?: boolean; provisional?: boolean } = {},
): EnrichedCandidate {
  const term = `word-${String(index)}`;
  return {
    term,
    type: "noun",
    meaning: `meaning for ${term}`,
    example: options.example
      ? `The ${term} appears in this useful context.`
      : "A verified example is not available yet.",
    challenge: "Which meaning matches this word?",
    candidateId: `candidate-${String(index)}`,
    normalizedLemma: term,
    selectionReasons: [],
    lexicalValidationStatus: "verified",
    rank: index,
    rankingScore: 10,
    rankingContributions: [],
    senseId: `sense-${String(index)}`,
    ...(options.provisional
      ? {
          exampleProvenance: {
            provider: "ollama-local",
            sourceId: `example-${String(index)}`,
            retrievedAt: "2026-08-12T10:00:00.000Z",
            generated: true,
            validationStatus: "provisional" as const,
          },
        }
      : {}),
    qualityReport: {
      candidateId: `candidate-${String(index)}`,
      decision: "accept",
      exerciseReadiness: "ready",
      overallScore: 80,
      dimensions: {
        lexicalCoverage: 100,
        exerciseReadiness: 70,
        exampleCoverage: 0,
        frequencyEvidence: 100,
        ambiguityRisk: 0,
      },
      reasonCodes: ["verified-sense"],
    },
  };
}

describe("learning-set readiness", () => {
  it("reports a complete definition-ready set without requiring cloze examples", () => {
    const report = evaluateLearningSetReadiness({
      candidates: [1, 2, 3, 4].map((index) => candidate(index, { example: true })),
      fulfillment: {
        status: "exact",
        requestedCount: 4,
        deliveredCount: 4,
        deficitCount: 0,
        attempts: 1,
      },
    });

    expect(report).toMatchObject({
      status: "ready",
      verifiedLexicalCount: 4,
      contextualExampleCount: 4,
      definitionReadyCount: 4,
      sessionReadyCount: 4,
      deficitCount: 0,
    });
  });

  it("reports a usable partial set and explains provisional coverage", () => {
    const report = evaluateLearningSetReadiness({
      candidates: [1, 2, 3, 4, 5, 6].map((index) =>
        candidate(index, { example: index <= 4, provisional: index <= 2 }),
      ),
      fulfillment: {
        status: "partial",
        requestedCount: 10,
        deliveredCount: 6,
        deficitCount: 4,
        attempts: 3,
      },
    });

    expect(report.status).toBe("partial");
    expect(report.sessionReadyCount).toBe(6);
    expect(report.deficitCount).toBe(4);
    expect(report.provisionalExampleCount).toBe(2);
    expect(report.reasonCodes).toEqual(
      expect.arrayContaining([
        "requested-count-shortfall",
        "example-coverage-gap",
        "provisional-examples-present",
      ]),
    );
  });

  it("blocks a set that cannot produce the four-question minimum", () => {
    const report = evaluateLearningSetReadiness({
      candidates: [1, 2, 3].map((index) => candidate(index, { example: true })),
      fulfillment: {
        status: "partial",
        requestedCount: 5,
        deliveredCount: 3,
        deficitCount: 2,
        attempts: 3,
      },
    });

    expect(report.status).toBe("blocked");
    expect(report.reasonCodes).toContain("insufficient-publishable-exercises");
  });
});
