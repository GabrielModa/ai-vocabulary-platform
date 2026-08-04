import { describe, expect, it } from "vitest";
import { verifiedExerciseId, type VerifiedExercise } from "./exercise-composer.js";
import { evaluatePedagogicalReadiness } from "./pedagogical-readiness.js";

function exercise(overrides: Partial<VerifiedExercise> = {}): VerifiedExercise {
  const candidateId = "candidate:sample:verb";
  const senseId = "oewn-sample-verb";
  const exampleId = "oewn-sample-verb:example:1";

  return {
    ok: true,
    exerciseId: verifiedExerciseId(candidateId, senseId, exampleId),
    exerciseKind: "cloze",
    candidateId,
    senseId,
    exampleId,
    sourceSentence: "Students can sample regional dishes during the festival.",
    gapSentence: "Students can ___ regional dishes during the festival.",
    answer: "sample",
    options: ["sample", "taste", "serve", "cook"],
    distractorCandidateIds: ["candidate:taste:verb", "candidate:serve:verb", "candidate:cook:verb"],
    provenance: {
      exampleProvider: "open-english-wordnet",
      exampleSourceRecordId: exampleId,
      lexicalProvider: "open-english-wordnet",
      lexicalSourceRecordId: senseId,
    },
    compositionStrategy: "verified-example-deterministic-distractors-sense-bound-cloze",
    ...overrides,
  };
}

describe("pedagogical readiness", () => {
  it("marks a contextual structurally valid exercise ready", () => {
    const result = evaluatePedagogicalReadiness(exercise());

    expect(result).toMatchObject({
      ready: true,
      status: "pedagogically-ready",
      issues: [],
      policy: "deterministic-conservative-v1",
      semanticUniqueness: "not-proven",
    });
    expect(result).not.toHaveProperty("structuralIssues");
  });

  it("routes structurally invalid exercises directly to fallback", () => {
    const result = evaluatePedagogicalReadiness(
      exercise({ gapSentence: "Students sample regional dishes." }),
    );

    expect(result).toMatchObject({
      ready: false,
      status: "needs-fallback",
      issues: [{ reason: "structurally-not-ready" }],
      structuralIssues: [{ reason: "invalid-gap-count" }],
    });
  });

  it("rejects a sentence with fewer than three visible context tokens", () => {
    const result = evaluatePedagogicalReadiness(
      exercise({
        sourceSentence: "Please sample now.",
        gapSentence: "Please ___ now.",
      }),
    );

    expect(result).toMatchObject({
      ready: false,
      issues: [
        {
          reason: "context-too-short",
          evidence: {
            contextTokenCount: 2,
            minimumContextTokens: 3,
          },
        },
      ],
    });
  });

  it("rejects an answer that dominates the source sentence", () => {
    const result = evaluatePedagogicalReadiness(
      exercise({
        sourceSentence: "Internationalization is useful.",
        gapSentence: "___ is useful.",
        answer: "internationalization",
        options: ["internationalization", "localization", "translation", "adaptation"],
      }),
    );

    expect(result).toMatchObject({ ready: false });
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: "answer-dominates-context",
        }),
      ]),
    );
  });

  it("rejects an option already visible outside the gap", () => {
    const result = evaluatePedagogicalReadiness(
      exercise({
        sourceSentence: "Students sample dishes while cooks serve regional food.",
        gapSentence: "Students ___ dishes while cooks serve regional food.",
      }),
    );

    expect(result).toMatchObject({
      ready: false,
      issues: [
        expect.objectContaining({
          reason: "option-visible-outside-gap",
          evidence: { option: "serve" },
        }),
      ],
    });
  });

  it("normalizes case when checking visible options", () => {
    const result = evaluatePedagogicalReadiness(
      exercise({
        sourceSentence: "Students sample dishes while cooks SERVE regional food.",
        gapSentence: "Students ___ dishes while cooks SERVE regional food.",
      }),
    );

    expect(result).toMatchObject({
      ready: false,
      issues: [
        expect.objectContaining({
          reason: "option-visible-outside-gap",
          evidence: { option: "serve" },
        }),
      ],
    });
  });

  it("collects multiple pedagogical fallback reasons", () => {
    const result = evaluatePedagogicalReadiness(
      exercise({
        sourceSentence: "Sample taste.",
        gapSentence: "___ taste.",
      }),
    );

    expect(result).toMatchObject({ ready: false });
    expect(result.issues.map((entry) => entry.reason)).toEqual(
      expect.arrayContaining(["context-too-short", "option-visible-outside-gap"]),
    );
  });

  it("does not claim semantic uniqueness", () => {
    const result = evaluatePedagogicalReadiness(exercise());

    expect(result.semanticUniqueness).toBe("not-proven");
  });

  it("does not mutate the exercise", () => {
    const input = exercise();
    const originalOptions = [...input.options];

    evaluatePedagogicalReadiness(input);

    expect(input.options).toEqual(originalOptions);
  });
});
