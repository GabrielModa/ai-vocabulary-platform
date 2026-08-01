import { describe, expect, it } from "vitest";
import { confirmCollection, createCollectionDraft } from "./collection.js";
import { InMemoryVocabularyCollectionRepository, RepositoryError } from "./repository.js";

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
describe("vocabulary collection repository", () => {
  it("creates and retrieves a complete learner-owned collection", async () => {
    const repository = new InMemoryVocabularyCollectionRepository();
    expect(await repository.create(draft)).toEqual({ collection: draft, version: 1 });
    expect(await repository.findOwned("learner_1", draft.id)).toEqual({
      collection: draft,
      version: 1,
    });
    expect(await repository.findOwned("other", draft.id)).toBeUndefined();
  });
  it("persists confirmation with optimistic versioning", async () => {
    const repository = new InMemoryVocabularyCollectionRepository();
    await repository.create(draft);
    const confirmed = confirmCollection(draft, [candidate.id]);
    expect(await repository.save(confirmed, 1)).toEqual({ collection: confirmed, version: 2 });
    await expect(repository.save(confirmed, 1)).rejects.toEqual(
      new RepositoryError("STALE_VERSION"),
    );
  });
  it("rejects duplicate creation and unknown writes", async () => {
    const repository = new InMemoryVocabularyCollectionRepository();
    await repository.create(draft);
    await expect(repository.create(draft)).rejects.toEqual(new RepositoryError("ALREADY_EXISTS"));
    await expect(new InMemoryVocabularyCollectionRepository().save(draft, 1)).rejects.toEqual(
      new RepositoryError("NOT_FOUND"),
    );
  });
  it("returns defensive copies instead of mutable stored state", async () => {
    const repository = new InMemoryVocabularyCollectionRepository();
    await repository.create(draft);
    const first = await repository.findOwned("learner_1", draft.id);
    if (!first) throw new Error("missing fixture");
    const firstCandidate = first.collection.candidates[0];
    if (!firstCandidate) throw new Error("missing candidate fixture");
    firstCandidate.englishTerm = "mutated";
    expect(
      (await repository.findOwned("learner_1", draft.id))?.collection.candidates[0]?.englishTerm,
    ).toBe("pitch");
  });
});
