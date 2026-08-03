import { describe, expect, it } from "vitest";
import { buildVerifiedCandidatePipeline, normalizeCandidateTerm } from "./candidate-pipeline.js";

const provenance = {
  provider: "open-english-wordnet",
  sourceVersion: "2025",
  sourceId: "sense-1",
  sourceUrl: "https://en-word.net/static/english-wordnet-2025-json.zip",
  license: "CC-BY-4.0",
  attribution: "Open English WordNet contributors",
  retrievedAt: "2026-08-03T00:00:00.000Z",
  generated: false,
  validationStatus: "verified",
} as const;

function sense(senseId: string, partOfSpeech = "noun") {
  return {
    word: "uncle",
    normalizedWord: "uncle",
    senseId,
    partOfSpeech,
    definition: `Definition for ${senseId}`,
    provenance: { ...provenance, sourceId: senseId },
  };
}

describe("verified candidate pipeline", () => {
  it("normalizes Unicode, case, and whitespace", () => {
    expect(normalizeCandidateTerm("  UNCLE  ")).toBe("uncle");
  });

  it("creates an atomic selected sense for one compatible verified result", async () => {
    const result = await buildVerifiedCandidatePipeline(
      [{ term: "uncle", proposedPartOfSpeech: "noun" }],
      { lookup: () => Promise.resolve([sense("family-n")]) },
    );
    expect(result.candidates[0]).toMatchObject({
      candidateId: "candidate:uncle:noun",
      lexicalStatus: "verified",
      selectedSense: {
        senseId: "family-n",
        definition: "Definition for family-n",
        partOfSpeech: "noun",
        confirmedBy: "unique-provider-match",
      },
      selectionReasons: ["suggested-by-local-ai"],
    });
  });

  it("keeps multiple compatible senses ambiguous", async () => {
    const result = await buildVerifiedCandidatePipeline(
      [{ term: "uncle", proposedPartOfSpeech: "noun" }],
      { lookup: () => Promise.resolve([sense("family-n"), sense("helper-n")]) },
    );
    expect(result.candidates[0]).toMatchObject({ lexicalStatus: "ambiguous" });
    expect(result.candidates[0]).not.toHaveProperty("selectedSense");
  });

  it("does not promote an incompatible word class", async () => {
    const result = await buildVerifiedCandidatePipeline(
      [{ term: "uncle", proposedPartOfSpeech: "verb" }],
      { lookup: () => Promise.resolve([sense("family-n")]) },
    );
    expect(result.candidates[0]).toMatchObject({ lexicalStatus: "provisional" });
  });

  it("keeps missing or failed lookup facts unavailable", async () => {
    const missing = await buildVerifiedCandidatePipeline([{ term: "invented" }], {
      lookup: () => Promise.resolve([]),
    });
    const failed = await buildVerifiedCandidatePipeline([{ term: "uncle" }], {
      lookup: () => Promise.reject(new Error("index unavailable")),
    });
    expect(missing.candidates[0]).toMatchObject({ lexicalStatus: "unavailable" });
    expect(failed.candidates[0]).toMatchObject({ lexicalStatus: "unavailable" });
  });

  it("rejects normalized duplicates and exposes the rejection", async () => {
    const result = await buildVerifiedCandidatePipeline(
      [
        { term: "Uncle", proposedPartOfSpeech: "noun" },
        { term: " uncle ", proposedPartOfSpeech: "noun" },
      ],
      { lookup: () => Promise.resolve([sense("family-n")]) },
    );
    expect(result.candidates).toHaveLength(1);
    expect(result.rejected).toEqual([
      { term: " uncle ", normalizedLemma: "uncle", reason: "duplicate-term" },
    ]);
  });
});
