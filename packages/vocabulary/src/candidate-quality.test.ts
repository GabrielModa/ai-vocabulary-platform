import { describe, expect, it } from "vitest";
import type { LearningCandidate } from "./candidate-pipeline.js";
import type { ContentProvenance, LexicalContent } from "./content.js";
import { evaluateCandidateQuality, evaluateSetQuality } from "./candidate-quality.js";

const provenance: ContentProvenance = {
  provider: "oewn",
  sourceId: "sense:goal",
  retrievedAt: "2026-08-11T00:00:00.000Z",
  generated: false,
  validationStatus: "verified",
};

const sense: LexicalContent = {
  word: "goal",
  normalizedWord: "goal",
  senseId: "sense:goal",
  partOfSpeech: "noun",
  definition: "A point scored in a game.",
  provenance,
};

function candidate(status: LearningCandidate["lexicalStatus"]): LearningCandidate {
  return {
    candidateId: `candidate:goal:${status}`,
    displayForm: "goal",
    normalizedLemma: "goal",
    proposedPartOfSpeech: "noun",
    lexicalStatus: status,
    ...(status === "verified"
      ? {
          selectedSense: {
            senseId: sense.senseId,
            definition: sense.definition ?? "",
            partOfSpeech: sense.partOfSpeech,
            provenance,
            confirmedBy: "unique-provider-match" as const,
          },
        }
      : {}),
    availableSenses: status === "unavailable" ? [] : [sense],
    selectionReasons: ["matched-request-context"],
  };
}

describe("candidate quality gate", () => {
  it("accepts verified candidates and reports their exercise evidence", () => {
    expect(
      evaluateCandidateQuality({
        candidate: candidate("verified"),
        verifiedExampleCount: 3,
        hasFrequencyEvidence: true,
      }),
    ).toMatchObject({
      decision: "accept",
      exerciseReadiness: "ready",
      dimensions: {
        lexicalCoverage: 100,
        exerciseReadiness: 100,
        exampleCoverage: 100,
        frequencyEvidence: 100,
        ambiguityRisk: 0,
      },
      reasonCodes: ["verified-sense", "definition-exercise-ready", "verified-examples"],
    });
  });

  it("keeps ambiguous verified evidence for review instead of accepting it", () => {
    expect(
      evaluateCandidateQuality({
        candidate: candidate("ambiguous"),
        verifiedExampleCount: 1,
        hasFrequencyEvidence: false,
      }),
    ).toMatchObject({
      decision: "review",
      exerciseReadiness: "requires-review",
      dimensions: { lexicalCoverage: 70, ambiguityRisk: 60 },
      reasonCodes: ["verified-senses-ambiguous", "sense-confirmation-required"],
    });
  });

  it("rejects candidates without verified lexical coverage", () => {
    expect(
      evaluateCandidateQuality({
        candidate: candidate("unavailable"),
        verifiedExampleCount: 0,
        hasFrequencyEvidence: false,
      }),
    ).toMatchObject({
      decision: "reject",
      exerciseReadiness: "unavailable",
      overallScore: 0,
      reasonCodes: ["lexical-evidence-unavailable", "exercise-unavailable"],
    });
  });

  it("aggregates requested coverage without pretending rejected words were delivered", () => {
    const reports = [
      evaluateCandidateQuality({
        candidate: candidate("verified"),
        verifiedExampleCount: 1,
        hasFrequencyEvidence: true,
      }),
      evaluateCandidateQuality({
        candidate: candidate("ambiguous"),
        verifiedExampleCount: 0,
        hasFrequencyEvidence: false,
      }),
      evaluateCandidateQuality({
        candidate: candidate("unavailable"),
        verifiedExampleCount: 0,
        hasFrequencyEvidence: false,
      }),
    ];

    expect(evaluateSetQuality({ requestedCount: 4, candidates: reports })).toMatchObject({
      requestedCount: 4,
      evaluatedCount: 3,
      acceptedCount: 1,
      reviewCount: 1,
      rejectedCount: 1,
      usableCount: 2,
      deficitCount: 2,
      coveragePercentage: 50,
    });
  });
});
