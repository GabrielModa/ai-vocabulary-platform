import type { StudySessionSnapshot } from "@vocabulary/domain-vocabulary";
import { describe, expect, it } from "vitest";
import { STUDY_SESSION_RESPONSE_VERSION, serializeStudySession } from "./response-contract";

const base = {
  sessionId: "study-session:test",
  snapshotVersion: "study-session-snapshot-v1",
  title: "Vocabulary",
  level: "B1",
  createdAt: "2026-08-05T20:00:00.000Z",
  exerciseIds: ["exercise:1", "exercise:2"],
} as const;

describe("study session response contract", () => {
  it("serializes cloze and definition-choice exercises", () => {
    const snapshot: StudySessionSnapshot = {
      ...base,
      exercises: [
        {
          exerciseId: "exercise:1",
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
        },
        {
          exerciseId: "exercise:2",
          exerciseKind: "definition-choice",
          candidateId: "candidate:affection:noun",
          knowledgeId: "knowledge:affection",
          senseId: "sense:affection",
          prompt: "A feeling of fondness or care.",
          answer: "affection",
          options: ["affection", "agreement", "distance", "permission"],
          choiceIds: [
            "choice:affection",
            "choice:agreement",
            "choice:distance",
            "choice:permission",
          ],
          provenance: [],
        },
      ],
    };

    expect(serializeStudySession(snapshot)).toEqual({
      responseVersion: STUDY_SESSION_RESPONSE_VERSION,
      sessionId: base.sessionId,
      snapshotVersion: base.snapshotVersion,
      title: base.title,
      level: base.level,
      createdAt: base.createdAt,
      exercises: [
        {
          exerciseId: "exercise:1",
          exerciseKind: "cloze",
          gapSentence: "Students ___ dishes.",
          options: ["sample", "taste", "serve", "cook"],
        },
        {
          exerciseId: "exercise:2",
          exerciseKind: "definition-choice",
          prompt: "A feeling of fondness or care.",
          options: ["affection", "agreement", "distance", "permission"],
        },
      ],
    });
  });
});
