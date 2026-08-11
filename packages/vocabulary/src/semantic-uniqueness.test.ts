import { describe, expect, it } from "vitest";
import type { LearningCandidate } from "./candidate-pipeline.js";
import type { VerifiedExercise } from "./exercise-composer.js";
import { screenExerciseSemanticUniqueness } from "./semantic-uniqueness.js";

function candidate(lemma: string, definition: string): LearningCandidate {
  return {
    candidateId: `candidate:${lemma}:verb`,
    displayForm: lemma,
    normalizedLemma: lemma,
    proposedPartOfSpeech: "verb",
    lexicalStatus: "verified",
    selectedSense: {
      senseId: `sense:${lemma}`,
      definition,
      partOfSpeech: "verb",
      provenance: {
        provider: "oewn",
        sourceVersion: "2025",
        sourceId: `sense:${lemma}`,
        license: "CC-BY-4.0",
        attribution: "Open English WordNet contributors",
        retrievedAt: "2026-08-11T00:00:00.000Z",
        generated: false,
        validationStatus: "verified",
      },
      confirmedBy: "unique-provider-match",
    },
    availableSenses: [],
    selectionReasons: [],
  };
}

function exercise(
  sourceSentence = "Students sample regional dishes during the festival.",
): VerifiedExercise {
  return {
    ok: true,
    exerciseId: "exercise:sample",
    exerciseKind: "cloze",
    candidateId: "candidate:sample:verb",
    senseId: "sense:sample",
    exampleId: "example:sample",
    sourceSentence,
    gapSentence: sourceSentence.replace("sample", "___"),
    answer: "sample",
    options: ["sample", "taste", "serve", "cook"],
    distractorCandidateIds: ["candidate:taste:verb", "candidate:serve:verb", "candidate:cook:verb"],
    provenance: {
      exampleProvider: "oewn",
      exampleSourceRecordId: "example:sample",
      lexicalProvider: "oewn",
      lexicalSourceRecordId: "sense:sample",
    },
    compositionStrategy: "verified-example-deterministic-distractors-sense-bound-cloze",
  };
}

const answer = candidate("sample", "to try a small amount of food");
const distractors = [
  candidate("taste", "to perceive flavor with the mouth"),
  candidate("serve", "to provide food for another person"),
  candidate("cook", "to prepare food by applying heat"),
];

describe("exercise semantic uniqueness screen", () => {
  it("accepts distinct verified senses as evidence-screened", () => {
    expect(screenExerciseSemanticUniqueness({ exercise: exercise(), answer, distractors })).toEqual(
      {
        status: "evidence-screened",
        strategy: "verified-definition-overlap-v1",
        issues: [],
      },
    );
  });

  it("rejects a distractor that directly overlaps the answer definition", () => {
    const serve = distractors[1];
    const cook = distractors[2];
    if (!serve || !cook) throw new Error("Expected fixture distractors");
    const result = screenExerciseSemanticUniqueness({
      exercise: exercise(),
      answer,
      distractors: [candidate("taste", "to sample a small amount of food"), serve, cook],
    });

    expect(result).toMatchObject({
      status: "failed-screening",
      issues: [{ reason: "definition-cross-reference", distractorLemma: "taste" }],
    });
  });

  it("rejects distractors already visible in the sentence context", () => {
    expect(
      screenExerciseSemanticUniqueness({
        exercise: exercise("Students sample dishes while cooks serve regional food."),
        answer,
        distractors,
      }),
    ).toMatchObject({
      status: "failed-screening",
      issues: [{ reason: "distractor-present-in-context", distractorLemma: "serve" }],
    });
  });
});
