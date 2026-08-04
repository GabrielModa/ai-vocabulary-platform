import { describe, expect, it } from "vitest";
import { verifiedExerciseId, type VerifiedExercise } from "./exercise-composer.js";
import { validateVerifiedExercise } from "./exercise-validator.js";

function validExercise(): VerifiedExercise {
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
    sourceSentence: "Sample the regional dishes.",
    gapSentence: "___ the regional dishes.",
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
  };
}

describe("verified exercise validator", () => {
  it("marks a complete deterministic exercise structurally ready", () => {
    expect(validateVerifiedExercise(validExercise())).toMatchObject({
      ready: true,
      status: "structurally-ready",
      issues: [],
      semanticUniqueness: "not-evaluated",
    });
  });

  it("rejects an exercise ID that does not match its source identities", () => {
    const exercise = { ...validExercise(), exerciseId: "exercise:wrong" };

    expect(validateVerifiedExercise(exercise)).toMatchObject({
      ready: false,
      issues: [{ reason: "exercise-id-mismatch", field: "exerciseId" }],
    });
  });

  it("requires exactly one gap", () => {
    const noGap = { ...validExercise(), gapSentence: "Sample the dishes." };
    const twoGaps = {
      ...validExercise(),
      gapSentence: "___ and ___ the dishes.",
    };

    expect(validateVerifiedExercise(noGap)).toMatchObject({
      ready: false,
      issues: [{ reason: "invalid-gap-count" }],
    });
    expect(validateVerifiedExercise(twoGaps)).toMatchObject({
      ready: false,
      issues: [{ reason: "invalid-gap-count" }],
    });
  });

  it("requires exactly four unique non-empty options", () => {
    const exercise = {
      ...validExercise(),
      options: ["sample", "taste", "Sample", ""],
    };

    const result = validateVerifiedExercise(exercise);

    expect(result).toMatchObject({ ready: false });
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: "duplicate-option" })]),
    );
  });

  it("requires the answer to appear exactly once", () => {
    const exercise = {
      ...validExercise(),
      answer: "sample",
      options: ["taste", "serve", "cook", "try"],
    };

    expect(validateVerifiedExercise(exercise)).toMatchObject({
      ready: false,
      issues: [{ reason: "answer-not-present-once" }],
    });
  });

  it("requires three unique distractor candidate references", () => {
    const exercise = {
      ...validExercise(),
      distractorCandidateIds: ["candidate:taste:verb", "candidate:taste:verb"],
    };

    const result = validateVerifiedExercise(exercise);

    expect(result).toMatchObject({ ready: false });
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: "invalid-distractor-reference-count",
        }),
        expect.objectContaining({
          reason: "duplicate-distractor-reference",
        }),
      ]),
    );
  });

  it("requires complete lexical and example provenance", () => {
    const exercise = {
      ...validExercise(),
      provenance: {
        ...validExercise().provenance,
        lexicalSourceRecordId: "",
      },
    };

    expect(validateVerifiedExercise(exercise)).toMatchObject({
      ready: false,
      issues: [{ reason: "missing-provenance", field: "provenance" }],
    });
  });

  it("collects multiple issues instead of stopping at the first one", () => {
    const exercise = {
      ...validExercise(),
      exerciseId: "",
      gapSentence: "No gap here.",
      options: ["sample", "sample"],
      distractorCandidateIds: [],
    };

    const result = validateVerifiedExercise(exercise);

    expect(result).toMatchObject({ ready: false });
    expect(result.issues.map((entry) => entry.reason)).toEqual(
      expect.arrayContaining([
        "missing-identifier",
        "exercise-id-mismatch",
        "invalid-gap-count",
        "invalid-option-count",
        "duplicate-option",
        "invalid-distractor-reference-count",
      ]),
    );
  });

  it("does not claim that structural validation proves semantic uniqueness", () => {
    const result = validateVerifiedExercise(validExercise());

    expect(result.semanticUniqueness).toBe("not-evaluated");
  });

  it("does not mutate the exercise", () => {
    const exercise = validExercise();
    const optionsBefore = [...exercise.options];

    validateVerifiedExercise(exercise);

    expect(exercise.options).toEqual(optionsBefore);
  });
});
