import { describe, expect, it } from "vitest";
import type { VerifiedExercise } from "./exercise-composer.js";
import { buildStudySessionSnapshot } from "./study-session-snapshot.js";

function exercise(candidateId: string, answer: string): VerifiedExercise {
  return {
    ok: true,
    exerciseId: `exercise:${candidateId}:v1`,
    exerciseKind: "cloze",
    candidateId,
    senseId: `sense:${answer}`,
    exampleId: `example:${answer}`,
    sourceSentence: `Students ${answer} regional dishes.`,
    gapSentence: "Students ___ regional dishes.",
    answer,
    options: [answer, "taste", "serve", "cook"],
    distractorCandidateIds: ["taste", "serve", "cook"],
    provenance: {
      exampleProvider: "open-english-wordnet",
      exampleSourceRecordId: `example:${answer}`,
      lexicalProvider: "open-english-wordnet",
      lexicalSourceRecordId: `sense:${answer}`,
    },
    compositionStrategy: "verified-example-deterministic-distractors-sense-bound-cloze",
  };
}

const createdAt = "2026-08-04T12:30:00.000Z";

describe("study session snapshot", () => {
  it("freezes selected published exercises in selection order", () => {
    const sample = exercise("candidate:sample:verb", "sample");
    const inspect = exercise("candidate:inspect:verb", "inspect");

    const result = buildStudySessionSnapshot({
      title: "  Food vocabulary  ",
      level: "B1",
      createdAt,
      selectedCandidateIds: [inspect.candidateId, sample.candidateId],
      candidates: [
        {
          candidateId: sample.candidateId,
          outcome: { outcome: "publish", exercise: sample },
        },
        {
          candidateId: inspect.candidateId,
          outcome: { outcome: "publish", exercise: inspect },
        },
      ],
    });

    expect(result).toMatchObject({
      ok: true,
      snapshot: {
        snapshotVersion: "study-session-snapshot-v1",
        title: "Food vocabulary",
        level: "B1",
        createdAt,
        exerciseIds: [inspect.exerciseId, sample.exerciseId],
        exercises: [{ candidateId: inspect.candidateId }, { candidateId: sample.candidateId }],
      },
      omittedCandidateIds: [],
    });
  });

  it("omits fallback, reject, missing, and duplicate selections", () => {
    const sample = exercise("candidate:sample:verb", "sample");

    const result = buildStudySessionSnapshot({
      title: "Food",
      level: "B1",
      createdAt,
      selectedCandidateIds: [
        sample.candidateId,
        "candidate:fallback:verb",
        "candidate:reject:verb",
        "candidate:missing:verb",
        sample.candidateId,
      ],
      candidates: [
        {
          candidateId: sample.candidateId,
          outcome: { outcome: "publish", exercise: sample },
        },
        {
          candidateId: "candidate:fallback:verb",
          outcome: { outcome: "request-ai-fallback" },
        },
        {
          candidateId: "candidate:reject:verb",
          outcome: { outcome: "reject" },
        },
      ],
    });

    expect(result).toMatchObject({
      ok: true,
      snapshot: { exerciseIds: [sample.exerciseId] },
      omittedCandidateIds: [
        "candidate:fallback:verb",
        "candidate:reject:verb",
        "candidate:missing:verb",
      ],
    });
  });

  it("rejects sessions with no selected published exercise", () => {
    expect(
      buildStudySessionSnapshot({
        title: "Food",
        level: "B1",
        createdAt,
        selectedCandidateIds: ["candidate:sample:verb"],
        candidates: [
          {
            candidateId: "candidate:sample:verb",
            outcome: { outcome: "reject" },
          },
        ],
      }),
    ).toEqual({
      ok: false,
      code: "no-published-exercises",
      message: "At least one selected published exercise is required",
    });
  });

  it("rejects non-canonical timestamps", () => {
    expect(
      buildStudySessionSnapshot({
        title: "Food",
        level: "B1",
        createdAt: "2026-08-04",
        selectedCandidateIds: [],
        candidates: [],
      }),
    ).toMatchObject({
      ok: false,
      code: "invalid-created-at",
    });
  });

  it("creates a deterministic session ID", () => {
    const sample = exercise("candidate:sample:verb", "sample");
    const input = {
      title: "Food",
      level: "B1",
      createdAt,
      selectedCandidateIds: [sample.candidateId],
      candidates: [
        {
          candidateId: sample.candidateId,
          outcome: { outcome: "publish" as const, exercise: sample },
        },
      ],
    };

    const first = buildStudySessionSnapshot(input);
    const second = buildStudySessionSnapshot(input);

    expect(second).toEqual(first);
    expect(first).toMatchObject({
      ok: true,
      snapshot: {
        sessionId:
          "study-session:2026-08-04T12%3A30%3A00.000Z:exercise%3Acandidate%3Asample%3Averb%3Av1:v1",
      },
    });
  });

  it("copies exercise data instead of retaining mutable arrays", () => {
    const sample = exercise("candidate:sample:verb", "sample");
    const result = buildStudySessionSnapshot({
      title: "Food",
      level: "B1",
      createdAt,
      selectedCandidateIds: [sample.candidateId],
      candidates: [
        {
          candidateId: sample.candidateId,
          outcome: { outcome: "publish", exercise: sample },
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot.exercises[0]?.options).not.toBe(sample.options);
    expect(Object.isFrozen(result.snapshot.exercises)).toBe(true);
    expect(Object.isFrozen(result.snapshot.exercises[0]?.options)).toBe(true);
  });

  it("omits mismatched candidate and exercise IDs", () => {
    const sample = exercise("candidate:sample:verb", "sample");

    expect(
      buildStudySessionSnapshot({
        title: "Food",
        level: "B1",
        createdAt,
        selectedCandidateIds: ["candidate:other:verb"],
        candidates: [
          {
            candidateId: "candidate:other:verb",
            outcome: { outcome: "publish", exercise: sample },
          },
        ],
      }),
    ).toMatchObject({
      ok: false,
      code: "no-published-exercises",
    });
  });
});
