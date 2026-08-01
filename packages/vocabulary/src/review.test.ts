import { describe, expect, it } from "vitest";
import { createCollectionDraft } from "./collection.js";
import { InMemoryVocabularyCollectionRepository } from "./repository.js";
import { confirmReviewedCollection, editCandidate, ReviewError } from "./review.js";

const candidate = {
  id: "candidate_1",
  englishTerm: "pitch",
  sourceLanguage: "en",
  sense: "playing surface",
  partOfSpeech: "noun" as const,
  status: "proposed" as const,
};
const draft = createCollectionDraft({
  id: "collection_1",
  ownerId: "learner_1",
  title: "Football",
  level: "B1",
  source: { type: "topic", topic: "football", requestedCount: 1 },
  candidates: [candidate],
});
async function reader() {
  const repository = new InMemoryVocabularyCollectionRepository();
  await repository.create(draft);
  return repository;
}
describe("candidate review service", () => {
  it("allows the owner to edit while preserving proposed status", async () => {
    const updated = await editCandidate(
      { kind: "learner", subjectId: "learner_1" },
      draft.id,
      { ...candidate, englishTerm: "football pitch", status: "approved" },
      await reader(),
    );
    expect(updated.candidates[0]).toMatchObject({
      englishTerm: "football pitch",
      status: "proposed",
    });
  });
  it("confirms only the learner's explicit selection", async () => {
    const confirmed = await confirmReviewedCollection(
      { kind: "learner", subjectId: "learner_1" },
      draft.id,
      [candidate.id],
      await reader(),
    );
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.candidates[0]?.status).toBe("approved");
  });
  it("denies anonymous and non-owner access", async () => {
    const store = await reader();
    await expect(editCandidate({ kind: "anonymous" }, draft.id, candidate, store)).rejects.toEqual(
      new ReviewError("UNAUTHENTICATED"),
    );
    await expect(
      confirmReviewedCollection(
        { kind: "learner", subjectId: "other" },
        draft.id,
        [candidate.id],
        store,
      ),
    ).rejects.toEqual(new ReviewError("FORBIDDEN"));
  });
  it("does not reveal whether an unknown collection belongs to another learner", async () => {
    await expect(
      confirmReviewedCollection(
        { kind: "learner", subjectId: "learner_1" },
        "missing",
        [candidate.id],
        await reader(),
      ),
    ).rejects.toEqual(new ReviewError("NOT_FOUND"));
  });
});
