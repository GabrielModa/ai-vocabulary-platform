import { describe, expect, it } from "vitest";
import type { ExercisePipelineOutcome, VerifiedExercise } from "@vocabulary/domain-vocabulary";
import {
  serializeVocabularyGenerationResponse,
  toPublicExercisePipelineOutcome,
} from "./response-contract";

function exercise(): VerifiedExercise {
  return {
    ok: true,
    exerciseId: "exercise:candidate%3Asample%3Averb:sense:example:cloze:v1",
    exerciseKind: "cloze",
    candidateId: "candidate:sample:verb",
    senseId: "sense",
    exampleId: "example",
    sourceSentence: "Students sample regional food.",
    gapSentence: "Students ___ regional food.",
    answer: "sample",
    options: ["sample", "taste", "serve", "cook"],
    distractorCandidateIds: ["taste", "serve", "cook"],
    provenance: {
      exampleProvider: "oewn",
      exampleSourceRecordId: "example",
      lexicalProvider: "oewn",
      lexicalSourceRecordId: "sense",
    },
    compositionStrategy: "verified-example-deterministic-distractors-sense-bound-cloze",
  };
}

describe("vocabulary generation response contract", () => {
  it("exposes publish data without internal distractor IDs", () => {
    const outcome: ExercisePipelineOutcome = {
      outcome: "publish",
      pipeline: "verified-exercise-pipeline-v1",
      exercise: exercise(),
      semanticUniqueness: "evidence-screened",
    };

    const result = toPublicExercisePipelineOutcome(outcome);
    expect(result).toMatchObject({
      outcome: "publish",
      exercise: {
        answer: "sample",
        gapSentence: "Students ___ regional food.",
        options: ["sample", "taste", "serve", "cook"],
      },
    });
    if (result.outcome === "publish")
      expect(result.exercise).not.toHaveProperty("distractorCandidateIds");
  });

  it("exposes only a safe fallback summary", () => {
    const value = exercise();
    const outcome: ExercisePipelineOutcome = {
      outcome: "request-ai-fallback",
      pipeline: "verified-exercise-pipeline-v1",
      exercise: value,
      request: {
        requestId: "request:1",
        operation: "rewrite-context-only",
        exerciseId: value.exerciseId,
        candidateId: value.candidateId,
        senseId: value.senseId,
        answer: value.answer,
        currentSourceSentence: "Sample now.",
        currentGapSentence: "___ now.",
        options: value.options,
        triggeringReasons: ["context-too-short"],
        constraints: [],
        outputContract: {
          sourceSentence: "string",
          gapSentence: "string",
        },
      },
      readinessIssues: [],
      semanticUniqueness: "evidence-screened",
    };

    expect(toPublicExercisePipelineOutcome(outcome)).toEqual({
      outcome: "request-ai-fallback",
      pipeline: "verified-exercise-pipeline-v1",
      semanticUniqueness: "evidence-screened",
      operation: "rewrite-context-only",
      requestId: "request:1",
      triggeringReasons: ["context-too-short"],
    });
  });

  it("versions responses and preserves candidates without outcomes", () => {
    const response = serializeVocabularyGenerationResponse({
      title: "Fixture",
      candidates: [
        {
          term: "sample",
          meaning: "try a small amount",
          type: "verb",
          example: "Sample the food.",
          challenge: "Try a small amount",
          candidateId: "candidate:sample:verb",
          normalizedLemma: "sample",
          selectionReasons: [],
          lexicalValidationStatus: "provisional",
          rank: 1,
          rankingScore: 1,
          rankingContributions: [],
          qualityReport: {
            candidateId: "candidate:sample:verb",
            decision: "review",
            exerciseReadiness: "requires-review",
            overallScore: 45,
            dimensions: {
              lexicalCoverage: 70,
              exerciseReadiness: 40,
              exampleCoverage: 0,
              frequencyEvidence: 0,
              ambiguityRisk: 60,
            },
            reasonCodes: ["sense-confirmation-required"],
          },
        },
      ],
      candidateStrategy: "suggest-verify-select",
      rankingStrategy: "deterministic-weighted-ranking",
      qualitySummary: {
        requestedCount: 1,
        evaluatedCount: 1,
        acceptedCount: 0,
        reviewCount: 1,
        rejectedCount: 0,
        usableCount: 1,
        deficitCount: 0,
        coveragePercentage: 100,
        averageScore: 45,
        qualityBand: "low",
      },
      generationFulfillment: {
        status: "exact",
        requestedCount: 1,
        deliveredCount: 1,
        deficitCount: 0,
        attempts: 1,
      },
      rejectedCandidates: [],
    });

    expect(response.responseVersion).toBe("2026-08-11");
    expect(response.qualitySummary.coveragePercentage).toBe(100);
    expect(response.candidates[0]?.qualityReport.decision).toBe("review");
    expect(response.candidates[0]).not.toHaveProperty("exercisePipelineOutcome");
  });
});
