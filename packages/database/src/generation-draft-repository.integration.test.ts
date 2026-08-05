import { afterEach, describe, expect, it } from "vitest";
import { createGenerationDraftRepository, type GenerationDraftRecord } from "./runtime.js";
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

function record(overrides: Partial<GenerationDraftRecord> = {}): GenerationDraftRecord {
  return {
    draftId: "draft-1",
    subjectId: "learner-1",
    createdAt: "2026-08-05T00:00:00.000Z",
    expiresAt: "2026-08-05T01:00:00.000Z",
    payload: { trusted: true },
    ...overrides,
  };
}

describe("generation draft repository", () => {
  it("saves and loads an active learner draft", { timeout: 20_000 }, async () => {
    const instance = await isolatedDatabase();
    const repository = createGenerationDraftRepository(instance.database);
    const value = record();

    await expect(repository.save(value)).resolves.toEqual({
      created: true,
    });
    await expect(
      repository.findActive(value.subjectId, value.draftId, new Date("2026-08-05T00:30:00.000Z")),
    ).resolves.toEqual(value);
  });

  it("is idempotent for the same draft ID", { timeout: 20_000 }, async () => {
    const instance = await isolatedDatabase();
    const repository = createGenerationDraftRepository(instance.database);
    const value = record();

    await expect(repository.save(value)).resolves.toEqual({
      created: true,
    });
    await expect(repository.save(value)).resolves.toEqual({
      created: false,
    });
  });

  it("hides drafts from other learners and after expiry", { timeout: 20_000 }, async () => {
    const instance = await isolatedDatabase();
    const repository = createGenerationDraftRepository(instance.database);
    const value = record();
    await repository.save(value);

    await expect(
      repository.findActive("learner-2", value.draftId, new Date("2026-08-05T00:30:00.000Z")),
    ).resolves.toBeUndefined();

    await expect(
      repository.findActive(value.subjectId, value.draftId, new Date("2026-08-05T01:00:00.000Z")),
    ).resolves.toBeUndefined();
  });
});
