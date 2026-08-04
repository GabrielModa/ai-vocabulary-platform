import { afterEach, describe, expect, it } from "vitest";
import {
  createStudySessionOwnershipRepository,
  createStudySessionSnapshotRepository,
  type PersistedStudySessionSnapshot,
} from "./index.js";
import { createTestDatabase, type TestDatabase } from "./testing.js";

const databases: TestDatabase[] = [];

async function isolatedDatabase(): Promise<TestDatabase> {
  const database = await createTestDatabase();
  databases.push(database);
  return database;
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

function snapshot(): PersistedStudySessionSnapshot {
  return {
    sessionId: "study-session:owned:v1",
    snapshotVersion: "study-session-snapshot-v1",
    title: "Food",
    level: "B1",
    createdAt: "2026-08-04T12:30:00.000Z",
    exerciseIds: ["exercise:sample"],
    exercises: [
      {
        exerciseId: "exercise:sample",
        exerciseKind: "cloze",
        candidateId: "candidate:sample:verb",
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

describe("study session ownership repository", () => {
  it("binds ownership idempotently", { timeout: 20_000 }, async () => {
    const instance = await isolatedDatabase();
    const value = snapshot();
    await createStudySessionSnapshotRepository(instance.database).save(value);
    const ownership = createStudySessionOwnershipRepository(instance.database);

    await expect(ownership.bind("learner-1", value.sessionId)).resolves.toEqual({ created: true });
    await expect(ownership.bind("learner-1", value.sessionId)).resolves.toEqual({ created: false });
    await expect(ownership.owns("learner-1", value.sessionId)).resolves.toBe(true);
  });

  it("does not grant ownership to another learner", { timeout: 20_000 }, async () => {
    const instance = await isolatedDatabase();
    const value = snapshot();
    await createStudySessionSnapshotRepository(instance.database).save(value);
    const ownership = createStudySessionOwnershipRepository(instance.database);
    await ownership.bind("learner-1", value.sessionId);

    await expect(ownership.owns("learner-2", value.sessionId)).resolves.toBe(false);
  });

  it("rejects ownership for a missing snapshot", { timeout: 20_000 }, async () => {
    const instance = await isolatedDatabase();
    const ownership = createStudySessionOwnershipRepository(instance.database);

    await expect(ownership.bind("learner-1", "study-session:missing")).rejects.toThrow();
  });
});
