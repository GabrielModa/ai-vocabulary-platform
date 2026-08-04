import { describe, expect, it, vi } from "vitest";
import type { VerifiedExercise } from "./exercise-composer.js";
import {
  createOwnedStudySessionApplication,
  type StudySessionOwnershipPort,
} from "./owned-study-session-application.js";
import {
  createStudySessionApplication,
  type StudySessionApplication,
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
    title: "Food",
    level: "B1",
    createdAt: "2026-08-04T12:30:00.000Z",
    selectedCandidateIds: [published.candidateId],
    candidates: [
      {
        candidateId: published.candidateId,
        outcome: {
          outcome: "publish" as const,
          exercise: published,
        },
      },
    ],
  };
}

function sessionApplication(): StudySessionApplication {
  const stored = new Map<string, StudySessionSnapshot>();

  const repository: StudySessionSnapshotPort = {
    save(snapshot) {
      const existing = stored.get(snapshot.sessionId);

      if (existing) {
        return Promise.resolve({
          ok: true,
          created: false,
          snapshot: existing,
        });
      }

      stored.set(snapshot.sessionId, snapshot);

      return Promise.resolve({
        ok: true,
        created: true,
        snapshot,
      });
    },

    findById(sessionId) {
      return Promise.resolve(stored.get(sessionId));
    },
  };

  return createStudySessionApplication(repository);
}

function ownershipPort(): StudySessionOwnershipPort {
  const links = new Set<string>();

  return {
    bind(subjectId, sessionId) {
      const key = `${subjectId}:${sessionId}`;
      const created = !links.has(key);

      links.add(key);

      return Promise.resolve({ created });
    },

    owns(subjectId, sessionId) {
      return Promise.resolve(links.has(`${subjectId}:${sessionId}`));
    },
  };
}

describe("owned study session application", () => {
  it("binds a created session to the authenticated learner", async () => {
    const ownership = ownershipPort();
    const application = createOwnedStudySessionApplication(sessionApplication(), ownership);

    const created = await application.create(" learner-1 ", input());

    expect(created).toMatchObject({
      ok: true,
      status: "created",
    });

    if (!created.ok) return;

    await expect(ownership.owns("learner-1", created.snapshot.sessionId)).resolves.toBe(true);
  });

  it("allows the owner to retrieve a session", async () => {
    const application = createOwnedStudySessionApplication(sessionApplication(), ownershipPort());

    const created = await application.create("learner-1", input());

    if (!created.ok) {
      throw new Error("fixture creation failed");
    }

    await expect(application.get("learner-1", created.snapshot.sessionId)).resolves.toMatchObject({
      ok: true,
      status: "found",
      snapshot: created.snapshot,
    });
  });

  it("returns the same safe not-found result to another learner", async () => {
    const application = createOwnedStudySessionApplication(sessionApplication(), ownershipPort());

    const created = await application.create("learner-1", input());

    if (!created.ok) {
      throw new Error("fixture creation failed");
    }

    await expect(application.get("learner-2", created.snapshot.sessionId)).resolves.toEqual({
      ok: false,
      status: "not-found",
      code: "study-session-not-found",
      message: "Study session was not found",
    });
  });

  it("does not load before ownership succeeds", async () => {
    const base = sessionApplication();
    const get = vi.fn<StudySessionApplication["get"]>();

    const sessions: StudySessionApplication = {
      create: (...args) => base.create(...args),
      get,
    };

    const application = createOwnedStudySessionApplication(sessions, ownershipPort());

    await application.get("learner-1", "study-session:missing");

    expect(get).not.toHaveBeenCalled();
  });

  it("rejects blank authenticated identities", async () => {
    const bind = vi.fn<StudySessionOwnershipPort["bind"]>();

    const application = createOwnedStudySessionApplication(sessionApplication(), {
      ...ownershipPort(),
      bind,
    });

    await expect(application.create("   ", input())).resolves.toEqual({
      ok: false,
      status: "ownership-failed",
      code: "study-session-ownership-failed",
      message: "Authenticated learner identity is required",
    });

    expect(bind).not.toHaveBeenCalled();
  });

  it("returns a typed failure when ownership persistence fails", async () => {
    const application = createOwnedStudySessionApplication(sessionApplication(), {
      bind() {
        return Promise.reject(new Error("database unavailable"));
      },

      owns() {
        return Promise.resolve(false);
      },
    });

    await expect(application.create("learner-1", input())).resolves.toEqual({
      ok: false,
      status: "ownership-failed",
      code: "study-session-ownership-failed",
      message: "Study session ownership could not be recorded",
    });
  });
});
