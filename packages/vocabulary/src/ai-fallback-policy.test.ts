import { describe, expect, it } from "vitest";
import { verifiedExerciseId, type VerifiedExercise } from "./exercise-composer.js";
import { decideAiFallback } from "./ai-fallback-policy.js";
import { evaluatePedagogicalReadiness, type NeedsFallbackResult } from "./pedagogical-readiness.js";

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

describe("AI fallback policy", () => {
  it("does not request AI for an exercise already ready", () => {
    expect(decideAiFallback(evaluatePedagogicalReadiness(exercise()))).toEqual({
      decision: "not-required",
      policy: "ai-fallback-policy-v1",
      reason: "exercise-already-ready",
    });
  });

  it("allows only context rewriting for context-poor exercises", () => {
    const readiness = evaluatePedagogicalReadiness(
      exercise({
        sourceSentence: "Please sample now.",
        gapSentence: "Please ___ now.",
      }),
    );

    const decision = decideAiFallback(readiness);

    expect(decision).toMatchObject({
      decision: "allowed",
      policy: "ai-fallback-policy-v1",
      operation: "rewrite-context-only",
      request: {
        exerciseId: exercise().exerciseId,
        candidateId: "candidate:sample:verb",
        senseId: "oewn-sample-verb",
        answer: "sample",
        options: ["sample", "taste", "serve", "cook"],
        triggeringReasons: ["context-too-short"],
        outputContract: {
          sourceSentence: "string",
          gapSentence: "string",
        },
      },
    });
  });

  it("preserves strict constraints in the generated request", () => {
    const readiness = evaluatePedagogicalReadiness(
      exercise({
        sourceSentence: "Students sample dishes while cooks serve regional food.",
        gapSentence: "Students ___ dishes while cooks serve regional food.",
      }),
    );

    const decision = decideAiFallback(readiness);

    expect(decision).toMatchObject({ decision: "allowed" });
    if (decision.decision !== "allowed") return;

    expect(decision.request.constraints).toEqual([
      { code: "preserve-answer" },
      { code: "preserve-sense" },
      { code: "preserve-options" },
      { code: "preserve-provenance" },
      { code: "one-gap", value: 1 },
      { code: "no-visible-options" },
      { code: "minimum-context", value: 3 },
    ]);
  });

  it("prohibits AI when structural repair is required", () => {
    const readiness = evaluatePedagogicalReadiness(
      exercise({ gapSentence: "Students sample regional dishes." }),
    );

    expect(decideAiFallback(readiness)).toEqual({
      decision: "prohibited",
      policy: "ai-fallback-policy-v1",
      reason: "structural-repair-required",
      structuralReasons: ["invalid-gap-count"],
    });
  });

  it("prohibits AI when provenance is incomplete", () => {
    const readiness = evaluatePedagogicalReadiness(
      exercise({
        provenance: {
          ...exercise().provenance,
          lexicalSourceRecordId: "",
        },
      }),
    );

    expect(decideAiFallback(readiness)).toMatchObject({
      decision: "prohibited",
      structuralReasons: ["missing-provenance"],
    });
  });

  it("creates a deterministic request ID", () => {
    const readiness = evaluatePedagogicalReadiness(
      exercise({
        sourceSentence: "Sample taste.",
        gapSentence: "___ taste.",
      }),
    );

    const first = decideAiFallback(readiness);
    const second = decideAiFallback(readiness);

    expect(second).toEqual(first);
    expect(first).toMatchObject({
      decision: "allowed",
      request: {
        requestId:
          "ai-fallback:exercise%3Acandidate%253Asample%253Averb%3Aoewn-sample-verb%3Aoewn-sample-verb%253Aexample%253A1%3Acloze%3Av1:answer-dominates-context%2Ccontext-too-short%2Coption-visible-outside-gap:rewrite-context:v1",
      },
    });
  });

  it("normalizes and sorts triggering reasons", () => {
    const readiness = {
      ...evaluatePedagogicalReadiness(exercise()),
      ready: false,
      status: "needs-fallback",
      issues: [
        {
          reason: "option-visible-outside-gap",
          message: "fixture",
          evidence: {},
        },
        {
          reason: "context-too-short",
          message: "fixture",
          evidence: {},
        },
        {
          reason: "option-visible-outside-gap",
          message: "fixture",
          evidence: {},
        },
      ],
      structuralIssues: [],
    } as NeedsFallbackResult;

    const decision = decideAiFallback(readiness);

    expect(decision).toMatchObject({
      decision: "allowed",
      request: {
        triggeringReasons: ["context-too-short", "option-visible-outside-gap"],
      },
    });
  });

  it("does not mutate readiness or exercise options", () => {
    const readiness = evaluatePedagogicalReadiness(
      exercise({
        sourceSentence: "Please sample now.",
        gapSentence: "Please ___ now.",
      }),
    );
    const optionsBefore = [...readiness.exercise.options];

    decideAiFallback(readiness);

    expect(readiness.exercise.options).toEqual(optionsBefore);
  });
});
