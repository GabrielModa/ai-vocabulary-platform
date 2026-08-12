import { describe, expect, it, vi } from "vitest";
import type { EnrichedCandidate, EnrichedVocabularySet } from "./lexical-enrichment.js";
import { enrichMissingStudyExamples } from "./generated-example-enrichment.js";

const provisional = {
  provider: "ollama-local",
  sourceId: "candidate-coach:oewn-coach-n",
  retrievedAt: "2026-08-12T10:00:00.000Z",
  generated: true,
  validationStatus: "provisional" as const,
};

function vocabularySet(overrides: Partial<EnrichedCandidate> = {}): EnrichedVocabularySet {
  return {
    title: "Football vocabulary",
    candidates: [
      {
        term: "coach",
        type: "noun",
        meaning: "someone in charge of training a team",
        example: "A verified example is not available yet.",
        challenge: "Which meaning matches this word?",
        candidateId: "candidate-coach",
        normalizedLemma: "coach",
        selectionReasons: [],
        lexicalValidationStatus: "verified",
        rank: 1,
        rankingScore: 10,
        rankingContributions: [],
        senseId: "oewn-coach-n",
        qualityReport: {
          candidateId: "candidate-coach",
          decision: "accept",
          exerciseReadiness: "ready",
          overallScore: 90,
          dimensions: {
            lexicalCoverage: 100,
            exerciseReadiness: 70,
            exampleCoverage: 0,
            frequencyEvidence: 100,
            ambiguityRisk: 0,
          },
          reasonCodes: ["verified-sense", "definition-exercise-ready"],
        },
        ...overrides,
      },
    ],
    candidateStrategy: "suggest-verify-select",
    rankingStrategy: "deterministic-weighted-ranking",
    qualitySummary: {
      requestedCount: 1,
      evaluatedCount: 1,
      acceptedCount: 1,
      reviewCount: 0,
      rejectedCount: 0,
      averageScore: 100,
      coveragePercentage: 100,
      qualityBand: "high",
      usableCount: 1,
      deficitCount: 0,
    },
    rejectedCandidates: [],
    generationFulfillment: {
      status: "exact",
      requestedCount: 1,
      deliveredCount: 1,
      deficitCount: 0,
      attempts: 1,
    },
  } satisfies EnrichedVocabularySet;
}

describe("generated study example enrichment", () => {
  it("fills a missing example without claiming corpus verification", async () => {
    const generate = vi.fn(() =>
      Promise.resolve([
        { candidateId: "candidate-coach", sentence: "The coach trains our team after school." },
      ]),
    );

    const result = await enrichMissingStudyExamples(vocabularySet(), {
      topic: "football",
      level: "A2",
      generate,
      now: () => new Date("2026-08-12T10:00:00.000Z"),
    });

    expect(result.candidates[0]).toMatchObject({
      example: "The coach trains our team after school.",
      contexts: ["The coach trains our team after school."],
      exampleProvenance: provisional,
    });
    expect(result.candidates[0]).not.toHaveProperty("verifiedExamples");
  });

  it("does not overwrite a verified corpus example", async () => {
    const generate = vi.fn();
    const result = await enrichMissingStudyExamples(
      vocabularySet({
        example: "The coach planned a new training session.",
        verifiedExamples: [
          {
            id: "example-1",
            senseId: "oewn-coach-n",
            sentence: "The coach planned a new training session.",
            provenance: {
              provider: "open-english-wordnet",
              sourceId: "example-1",
              license: "CC-BY-4.0",
              attribution: "Open English WordNet contributors",
              retrievedAt: "2026-08-12T09:00:00.000Z",
              generated: false,
              validationStatus: "verified",
            },
          },
        ],
      }),
      { topic: "football", level: "A2", generate },
    );

    expect(generate).not.toHaveBeenCalled();
    expect(result.candidates[0]?.example).toBe("The coach planned a new training session.");
  });

  it("keeps the verified lexical result usable when local example generation fails", async () => {
    const result = await enrichMissingStudyExamples(vocabularySet(), {
      topic: "football",
      level: "A2",
      generate: () => Promise.reject(new Error("Ollama unavailable")),
    });

    expect(result.candidates[0]?.example).toBe("A verified example is not available yet.");
  });

  it("applies a validated partial result and keeps unresolved examples honest", async () => {
    const source = vocabularySet();
    const coach = source.candidates[0];
    if (!coach) throw new Error("Expected coach fixture");
    const penalty: EnrichedCandidate = {
      ...coach,
      term: "penalty",
      candidateId: "candidate-penalty",
      normalizedLemma: "penalty",
      senseId: "oewn-penalty-n",
      rank: 2,
      qualityReport: {
        ...coach.qualityReport,
        candidateId: "candidate-penalty",
      },
    };
    const result = await enrichMissingStudyExamples(
      { ...source, candidates: [...source.candidates, penalty] },
      {
        topic: "football",
        level: "A2",
        generate: () =>
          Promise.resolve([
            { candidateId: "candidate-coach", sentence: "The coach trains our team after school." },
          ]),
      },
    );

    expect(result.candidates[0]?.example).toBe("The coach trains our team after school.");
    expect(result.candidates[1]?.example).toBe("A verified example is not available yet.");
  });
});
