import { describe, expect, it } from "vitest";
import { lexicalContentSchema, provenanceSchema } from "./content.js";

const verifiedProvenance = {
  provider: "open-english-wordnet",
  sourceId: "oewn-00001740-n",
  sourceUrl: "https://example.test/oewn-00001740-n",
  license: "CC-BY-4.0",
  attribution: "Open English WordNet contributors",
  retrievedAt: "2026-08-03T00:00:00.000Z",
  generated: false,
  validationStatus: "verified",
} as const;

describe("hybrid content contracts", () => {
  it("accepts a verified lexical sense with explicit provenance", () => {
    expect(
      lexicalContentSchema.parse({
        word: "uncle",
        normalizedWord: "uncle",
        senseId: "oewn-00001740-n",
        partOfSpeech: "noun",
        definition: "a brother of one's parent",
        cefr: "A2",
        provenance: verifiedProvenance,
      }),
    ).toMatchObject({ normalizedWord: "uncle", provenance: { validationStatus: "verified" } });
  });

  it("keeps unknown facts absent", () => {
    const content = lexicalContentSchema.parse({
      word: "uncle",
      normalizedWord: "uncle",
      senseId: "local-draft-1",
      partOfSpeech: "noun",
      provenance: {
        provider: "local-ai",
        retrievedAt: "2026-08-03T00:00:00.000Z",
        generated: true,
        validationStatus: "provisional",
      },
    });
    expect(content).not.toHaveProperty("definition");
    expect(content).not.toHaveProperty("cefr");
  });

  it("rejects generated content that claims verified status", () => {
    expect(() =>
      provenanceSchema.parse({
        provider: "local-ai",
        retrievedAt: "2026-08-03T00:00:00.000Z",
        generated: true,
        validationStatus: "verified",
      }),
    ).toThrow();
  });

  it("rejects undeclared invented fields", () => {
    expect(() =>
      lexicalContentSchema.parse({
        word: "uncle",
        normalizedWord: "uncle",
        senseId: "oewn-00001740-n",
        partOfSpeech: "noun",
        pronunciation: "uhn-kuhl",
        provenance: verifiedProvenance,
      }),
    ).toThrow();
  });
});
