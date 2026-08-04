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
      semanticUniqueness: "not-proven",
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
      semanticUniqueness: "not-proven",
    };

    expect(toPublicExercisePipelineOutcome(outcome)).toEqual({
      outcome: "request-ai-fallback",
      pipeline: "verified-exercise-pipeline-v1",
      semanticUniqueness: "not-proven",
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
        },
      ],
      candidateStrategy: "suggest-verify-select",
      rankingStrategy: "deterministic-weighted-ranking",
      rejectedCandidates: [],
    });

    expect(response.responseVersion).toBe("2026-08-04");
    expect(response.candidates[0]).not.toHaveProperty("exercisePipelineOutcome");
  });
});
