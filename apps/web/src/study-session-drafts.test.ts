import type {
  GenerationDraftRecord,
  GenerationDraftRepository,
} from "@vocabulary/database/runtime";
import { describe, expect, it } from "vitest";
import {
  createPersistentStudySessionDrafts,
  GENERATION_DRAFT_VERSION,
} from "./study-session-drafts";

function repository(value?: GenerationDraftRecord): GenerationDraftRepository {
  return {
    save() {
      return Promise.resolve({ created: true });
    },
    findActive(subjectId, draftId) {
      if (value?.subjectId === subjectId && value.draftId === draftId) {
        return Promise.resolve(value);
      }
      return Promise.resolve(undefined);
    },
  };
}

function record(): GenerationDraftRecord {
  return {
    draftId: "draft-1",
    subjectId: "learner-1",
    createdAt: "2026-08-05T00:00:00.000Z",
    expiresAt: "2026-08-05T01:00:00.000Z",
    payload: {
      version: GENERATION_DRAFT_VERSION,
      title: "Food",
      level: "B1",
      createdAt: "2026-08-05T00:00:00.000Z",
      candidates: [
        {
          candidateId: "candidate:sample",
          outcome: { outcome: "reject" },
        },
      ],
    },
  };
}

describe("persistent study-session drafts", () => {
  it("resolves only selected candidates from a trusted draft", async () => {
    const drafts = createPersistentStudySessionDrafts(
      repository(record()),
      () => new Date("2026-08-05T00:30:00.000Z"),
    );

    await expect(
      drafts.resolve(" learner-1 ", {
        draftId: " draft-1 ",
        title: "Food",
        level: "B1",
        selectedCandidateIds: ["candidate:sample"],
      }),
    ).resolves.toMatchObject({
      ok: true,
      input: {
        title: "Food",
        level: "B1",
        selectedCandidateIds: ["candidate:sample"],
      },
    });
  });

  it("rejects candidates absent from the trusted draft", async () => {
    const drafts = createPersistentStudySessionDrafts(repository(record()));

    await expect(
      drafts.resolve("learner-1", {
        draftId: "draft-1",
        title: "Food",
        level: "B1",
        selectedCandidateIds: ["candidate:invented"],
      }),
    ).resolves.toMatchObject({
      ok: false,
      code: "invalid-selection",
    });
  });

  it("hides missing and cross-learner drafts", async () => {
    const drafts = createPersistentStudySessionDrafts(repository(record()));

    await expect(
      drafts.resolve("learner-2", {
        draftId: "draft-1",
        title: "Food",
        level: "B1",
        selectedCandidateIds: ["candidate:sample"],
      }),
    ).resolves.toEqual({
      ok: false,
      code: "draft-not-found",
      message: "Study session draft was not found",
    });
  });

  it("rejects client metadata that differs from the draft", async () => {
    const drafts = createPersistentStudySessionDrafts(repository(record()));

    await expect(
      drafts.resolve("learner-1", {
        draftId: "draft-1",
        title: "Changed",
        level: "B1",
        selectedCandidateIds: ["candidate:sample"],
      }),
    ).resolves.toMatchObject({
      ok: false,
      code: "invalid-selection",
    });
  });
});
