import { afterEach, describe, expect, it } from "vitest";
import {
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

function snapshot(
  overrides: Partial<PersistedStudySessionSnapshot> = {},
): PersistedStudySessionSnapshot {
  return {
    sessionId: "study-session:2026-08-04T12%3A30%3A00.000Z:exercise%3Asample:v1",
    snapshotVersion: "study-session-snapshot-v1",
    title: "Food vocabulary",
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
    ...overrides,
  };
}

describe("study session snapshot repository", () => {
  it("saves and loads an immutable snapshot", { timeout: 20_000 }, async () => {
    const instance = await isolatedDatabase();
    const repository = createStudySessionSnapshotRepository(instance.database);
    const value = snapshot();

    await expect(repository.save(value)).resolves.toMatchObject({
      ok: true,
      created: true,
      snapshot: value,
    });

    const loaded = await repository.findById(value.sessionId);
    expect(loaded).toEqual(value);
    expect(Object.isFrozen(loaded)).toBe(true);
    expect(Object.isFrozen(loaded?.exercises)).toBe(true);
    expect(Object.isFrozen(loaded?.exercises[0]?.options)).toBe(true);
  });

  it("is idempotent for the same session snapshot", { timeout: 20_000 }, async () => {
    const instance = await isolatedDatabase();
    const repository = createStudySessionSnapshotRepository(instance.database);
    const value = snapshot();

    const first = await repository.save(value);
    const second = await repository.save(value);

    expect(first).toMatchObject({ ok: true, created: true });
    expect(second).toMatchObject({ ok: true, created: false });
    expect(await repository.findById(value.sessionId)).toEqual(value);
  });

  it("rejects reuse of a session ID with different content", { timeout: 20_000 }, async () => {
    const instance = await isolatedDatabase();
    const repository = createStudySessionSnapshotRepository(instance.database);
    const value = snapshot();

    await repository.save(value);

    await expect(repository.save(snapshot({ title: "Changed title" }))).resolves.toEqual({
      ok: false,
      code: "session-id-conflict",
      message: "The session ID is already associated with a different snapshot",
    });
    expect((await repository.findById(value.sessionId))?.title).toBe("Food vocabulary");
  });

  it("returns undefined for an unknown session", { timeout: 20_000 }, async () => {
    const instance = await isolatedDatabase();
    const repository = createStudySessionSnapshotRepository(instance.database);

    await expect(repository.findById("study-session:missing")).resolves.toBeUndefined();
  });

  it("reset removes saved sessions", { timeout: 20_000 }, async () => {
    const instance = await isolatedDatabase();
    const repository = createStudySessionSnapshotRepository(instance.database);
    const value = snapshot();

    await repository.save(value);
    await instance.reset();

    await expect(repository.findById(value.sessionId)).resolves.toBeUndefined();
  });

  it("isolates independent test databases", { timeout: 20_000 }, async () => {
    const first = await isolatedDatabase();
    const second = await isolatedDatabase();
    const value = snapshot();

    await createStudySessionSnapshotRepository(first.database).save(value);

    await expect(
      createStudySessionSnapshotRepository(second.database).findById(value.sessionId),
    ).resolves.toBeUndefined();
  });
});
