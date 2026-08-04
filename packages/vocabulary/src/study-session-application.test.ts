import { describe, expect, it, vi } from "vitest";
import type { VerifiedExercise } from "./exercise-composer.js";
import {
  createStudySessionApplication,
  type StudySessionSnapshotPort,
} from "./study-session-application.js";
import type { StudySessionSnapshot } from "./study-session-snapshot.js";

function exercise(): VerifiedExercise {
  return {
    ok: true,
    exerciseId: "exercise:sample:v1",
    exerciseKind: "cloze",
    candidateId: "candidate:sample:verb",
    senseId: "sense:sample",
    exampleId: "example:sample",
    sourceSentence: "Students sample regional dishes.",
    gapSentence: "Students ___ regional dishes.",
    answer: "sample",
    options: ["sample", "taste", "serve", "cook"],
    distractorCandidateIds: ["taste", "serve", "cook"],
    provenance: {
      exampleProvider: "open-english-wordnet",
      exampleSourceRecordId: "example:sample",
      lexicalProvider: "open-english-wordnet",
      lexicalSourceRecordId: "sense:sample",
    },
    compositionStrategy: "verified-example-deterministic-distractors-sense-bound-cloze",
  };
}

function input() {
  const published = exercise();
  return {
    title: "Food vocabulary",
    level: "B1",
    createdAt: "2026-08-04T12:30:00.000Z",
    selectedCandidateIds: [published.candidateId, "candidate:rejected:verb"],
    candidates: [
      {
        candidateId: published.candidateId,
        outcome: { outcome: "publish" as const, exercise: published },
      },
      {
        candidateId: "candidate:rejected:verb",
        outcome: { outcome: "reject" as const },
      },
    ],
  };
}

function repository(overrides: Partial<StudySessionSnapshotPort> = {}): StudySessionSnapshotPort {
  const stored = new Map<string, StudySessionSnapshot>();

  return {
    save(snapshot) {
      const existing = stored.get(snapshot.sessionId);
      if (existing) {
        return Promise.resolve({
          ok: true as const,
          created: false,
          snapshot: existing,
        });
      }

      stored.set(snapshot.sessionId, snapshot);
      return Promise.resolve({
        ok: true as const,
        created: true,
        snapshot,
      });
    },

    findById(sessionId) {
      return Promise.resolve(stored.get(sessionId));
    },

    ...overrides,
  };
}

describe("study session application", () => {
  it("builds and persists a new session", async () => {
    const application = createStudySessionApplication(repository());

    await expect(application.create(input())).resolves.toMatchObject({
      ok: true,
      status: "created",
      omittedCandidateIds: ["candidate:rejected:verb"],
      snapshot: {
        title: "Food vocabulary",
        exerciseIds: ["exercise:sample:v1"],
      },
    });
  });

  it("reports an idempotently existing session", async () => {
    const port = repository();
    const application = createStudySessionApplication(port);

    const first = await application.create(input());
    const second = await application.create(input());

    expect(first).toMatchObject({ ok: true, status: "created" });
    expect(second).toMatchObject({ ok: true, status: "existing" });
  });

  it("does not call persistence for invalid input", async () => {
    const save = vi.fn<StudySessionSnapshotPort["save"]>();
    const application = createStudySessionApplication(repository({ save }));

    await expect(application.create({ ...input(), title: "   " })).resolves.toMatchObject({
      ok: false,
      status: "invalid",
      code: "invalid-title",
    });
    expect(save).not.toHaveBeenCalled();
  });

  it("maps repository conflicts without hiding them", async () => {
    const application = createStudySessionApplication(
      repository({
        save() {
          return Promise.resolve({
            ok: false as const,
            code: "session-id-conflict" as const,
            message: "conflict",
          });
        },
      }),
    );

    await expect(application.create(input())).resolves.toEqual({
      ok: false,
      status: "conflict",
      code: "session-id-conflict",
      message: "conflict",
    });
  });

  it("loads an existing session", async () => {
    const port = repository();
    const application = createStudySessionApplication(port);
    const created = await application.create(input());
    if (!created.ok) throw new Error("fixture creation failed");

    await expect(application.get(created.snapshot.sessionId)).resolves.toEqual({
      ok: true,
      status: "found",
      snapshot: created.snapshot,
    });
  });

  it("returns the same safe not-found result for blank and unknown IDs", async () => {
    const application = createStudySessionApplication(repository());

    await expect(application.get("   ")).resolves.toEqual({
      ok: false,
      status: "not-found",
      code: "study-session-not-found",
      message: "Study session was not found",
    });
    await expect(application.get("study-session:missing")).resolves.toEqual({
      ok: false,
      status: "not-found",
      code: "study-session-not-found",
      message: "Study session was not found",
    });
  });

  it("normalizes session IDs before lookup", async () => {
    const findById = vi.fn<StudySessionSnapshotPort["findById"]>(() => Promise.resolve(undefined));
    const application = createStudySessionApplication(repository({ findById }));

    await application.get("  study-session:fixture  ");

    expect(findById).toHaveBeenCalledWith("study-session:fixture");
  });
});
