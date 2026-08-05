import type { StudySessionSnapshot } from "@vocabulary/domain-vocabulary";
import { describe, expect, it } from "vitest";
import {
  evaluateStudySessionExerciseAnswer,
  serializeStudySessionExercise,
} from "./study-session-exercise-runtime";

type SnapshotExercise = StudySessionSnapshot["exercises"][number];

const cloze: SnapshotExercise = {
  exerciseId: "exercise:cloze",
  exerciseKind: "cloze",
  candidateId: "candidate:sample",
  senseId: "sense:sample",
  exampleId: "example:sample",
  sourceSentence: "Students sample dishes.",
  gapSentence: "Students ___ dishes.",
  answer: "sample",
  options: ["sample", "taste", "serve", "cook"],
  provenance: {
    exampleProvider: "oewn",
    exampleSourceRecordId: "example:sample",
    lexicalProvider: "oewn",
    lexicalSourceRecordId: "sense:sample",
  },
};

const definitionChoice: SnapshotExercise = {
  exerciseId: "exercise:definition",
  exerciseKind: "definition-choice",
  candidateId: "candidate:affection:noun",
  knowledgeId: "knowledge:affection",
  senseId: "sense:affection",
  prompt: "A feeling of fondness or care.",
  answer: "affection",
  options: ["affection", "agreement", "distance", "permission"],
  choiceIds: ["choice:affection", "choice:agreement", "choice:distance", "choice:permission"],
  provenance: [],
};

describe("study-session exercise runtime", () => {
  it("serializes cloze without exposing its answer", () => {
    expect(serializeStudySessionExercise(cloze)).toEqual({
      exerciseId: "exercise:cloze",
      exerciseKind: "cloze",
      gapSentence: "Students ___ dishes.",
      options: ["sample", "taste", "serve", "cook"],
    });
  });

  it("serializes definition choice without exposing its answer", () => {
    expect(serializeStudySessionExercise(definitionChoice)).toEqual({
      exerciseId: "exercise:definition",
      exerciseKind: "definition-choice",
      prompt: "A feeling of fondness or care.",
      options: ["affection", "agreement", "distance", "permission"],
    });
  });

  it.each([
    ["cloze", cloze, "sample"],
    ["definition-choice", definitionChoice, "affection"],
  ] as const)("evaluates %s answers through one contract", (_kind, exercise, answer) => {
    expect(evaluateStudySessionExerciseAnswer(exercise, ` ${answer} `)).toEqual({
      ok: true,
      exerciseId: exercise.exerciseId,
      selectedOption: answer,
      correct: true,
      correctAnswer: answer,
    });
  });

  it("rejects an option outside the persisted exercise", () => {
    expect(evaluateStudySessionExerciseAnswer(definitionChoice, "invented")).toEqual({
      ok: false,
      code: "INVALID_STUDY_SESSION_OPTION",
      message: "Selected option is not available for this exercise",
    });
  });
});
