import { describe, expect, it } from "vitest";
import type { StudySessionSnapshot } from "@vocabulary/domain-vocabulary";
import { serializeStudySession } from "./response-contract";

function snapshot(): StudySessionSnapshot {
  return {
    sessionId: "study-session:fixture",
    snapshotVersion: "study-session-snapshot-v1",
    title: "Food",
    level: "B1",
    createdAt: "2026-08-04T12:30:00.000Z",
    exerciseIds: ["exercise:sample"],
    exercises: [
      {
        exerciseId: "exercise:sample",
        exerciseKind: "cloze",
        candidateId: "candidate:sample",
        senseId: "sense:sample",
        exampleId: "example:sample",
        sourceSentence: "Students sample regional dishes.",
        gapSentence: "Students ___ regional dishes.",
        answer: "sample",
        options: ["sample", "taste", "serve", "cook"],
        provenance: {
          exampleProvider: "open-english-wordnet",
          exampleSourceRecordId: "example:sample",
          lexicalProvider: "open-english-wordnet",
          lexicalSourceRecordId: "sense:sample",
        },
      },
    ],
  };
}

describe("study session public response", () => {
  it("exposes only learner-facing exercise fields", () => {
    const response = serializeStudySession(snapshot());

    expect(response).toEqual({
      responseVersion: "study-session-response-v1",
      sessionId: "study-session:fixture",
      snapshotVersion: "study-session-snapshot-v1",
      title: "Food",
      level: "B1",
      createdAt: "2026-08-04T12:30:00.000Z",
      exercises: [
        {
          exerciseId: "exercise:sample",
          exerciseKind: "cloze",
          gapSentence: "Students ___ regional dishes.",
          options: ["sample", "taste", "serve", "cook"],
        },
      ],
    });

    expect(JSON.stringify(response)).not.toMatch(
      /answer|sourceSentence|provenance|candidateId|senseId|exampleId/u,
    );
  });

  it("returns frozen collections", () => {
    const response = serializeStudySession(snapshot());

    expect(Object.isFrozen(response)).toBe(true);
    expect(Object.isFrozen(response.exercises)).toBe(true);
    expect(Object.isFrozen(response.exercises[0]?.options)).toBe(true);
  });
});
