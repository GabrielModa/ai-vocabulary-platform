import { describe, expect, it } from "vitest";
import {
  confirmCollection,
  createCollectionDraft,
  isTrainingEligible,
  upsertCandidate,
  VocabularyDomainError,
} from "./collection.js";
import type { CefrLevel, CollectionSource, VocabularyCandidate } from "./model.js";

const football: VocabularyCandidate = {
  id: "candidate_1",
  englishTerm: "pitch",
  sourceTerm: "campo",
  sourceLanguage: "pt-BR",
  sense: "the playing area used for a football match",
  partOfSpeech: "noun",
  sourceContext: "The players entered the pitch.",
  status: "proposed",
};

function draft(source: CollectionSource, level: CefrLevel = "B1") {
  return createCollectionDraft({
    id: "collection_1",
    ownerId: "learner_1",
    title: "Football",
    level,
    source,
    candidates: [football],
  });
}

describe("learner-owned vocabulary collections", () => {
  it.each([
    { type: "text", text: "campo, chute, goleiro", language: "pt-BR" },
    { type: "topic", topic: "football", requestedCount: 30 },
    { type: "photo", mediaReference: "media_1", context: "A football match" },
  ] satisfies CollectionSource[])("creates an editable $type draft", (source) => {
    const collection = draft(source);
    expect(collection.ownerId).toBe("learner_1");
    expect(collection.status).toBe("draft");
    expect(isTrainingEligible(collection)).toBe(false);
  });

  it("validates CEFR range and topic requested count", () => {
    expect(() => draft({ type: "topic", topic: "football", requestedCount: 0 })).toThrow(
      VocabularyDomainError,
    );
    expect(() => draft({ type: "topic", topic: "football", requestedCount: 101 })).toThrow(
      VocabularyDomainError,
    );
    expect(() =>
      draft({ type: "topic", topic: "football", requestedCount: 30 }, "A1" as CefrLevel),
    ).toThrow(VocabularyDomainError);
  });

  it("edits a proposed candidate while preserving learner ownership", () => {
    const collection = draft({ type: "topic", topic: "football", requestedCount: 30 });
    const edited = upsertCandidate(collection, {
      ...football,
      englishTerm: "football pitch",
      status: "approved",
    });
    expect(edited.candidates[0]).toEqual(
      expect.objectContaining({ englishTerm: "football pitch", status: "proposed" }),
    );
    expect(edited.ownerId).toBe(collection.ownerId);
  });

  it("allows separate senses but rejects exact term and sense duplicates", () => {
    const collection = draft({ type: "text", text: "pitch", language: "en" });
    const separateSense = upsertCandidate(collection, {
      ...football,
      id: "candidate_2",
      sense: "the highness or lowness of a sound",
    });
    expect(separateSense.candidates).toHaveLength(2);
    expect(() =>
      upsertCandidate(collection, { ...football, id: "candidate_3", englishTerm: "PITCH" }),
    ).toThrowError("Vocabulary operation failed: DUPLICATE_CANDIDATE");
  });

  it("requires explicit valid selection before training and locks confirmed collections", () => {
    const collection = draft({ type: "photo", mediaReference: "media_1" });
    expect(() => confirmCollection(collection, [])).toThrowError(
      "Vocabulary operation failed: INVALID_SELECTION",
    );
    expect(() => confirmCollection(collection, ["another_collection_candidate"])).toThrowError(
      "Vocabulary operation failed: INVALID_SELECTION",
    );
    const confirmed = confirmCollection(collection, [football.id]);
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.candidates[0]?.status).toBe("approved");
    expect(isTrainingEligible(confirmed)).toBe(true);
    expect(() => upsertCandidate(confirmed, football)).toThrowError(
      "Vocabulary operation failed: COLLECTION_CONFIRMED",
    );
  });

  it("keeps validation errors free of learner content and ownership details", () => {
    const privateValue = "private learner supplied content";
    try {
      createCollectionDraft({
        id: "collection_1",
        ownerId: privateValue,
        title: "",
        level: "B1",
        source: { type: "text", text: privateValue, language: "en" },
      });
    } catch (error) {
      expect(String(error)).toBe(
        "VocabularyDomainError: Vocabulary operation failed: INVALID_COLLECTION",
      );
      expect(String(error)).not.toContain(privateValue);
    }
  });
});
