import { describe, expect, it } from "vitest";
import { OewnLexicalProvider } from "./oewn.js";

const dataset = {
  metadata: {
    provider: "open-english-wordnet",
    sourceVersion: "2025",
    sourceUrl: "https://en-word.net/static/english-wordnet-2025-json.zip",
    license: "CC-BY-4.0",
    attribution: "Open English WordNet contributors",
    retrievedAt: "2025-12-31T00:00:00.000Z",
  },
  entries: {
    uncle: [
      {
        senseId: "oewn-10755748-n",
        partOfSpeech: "noun",
        definition: "the brother of your father or mother; the husband of your aunt",
      },
    ],
  },
} as const;

describe("Open English WordNet lexical provider", () => {
  it("normalizes a lookup and materializes verified provenance", async () => {
    const provider = new OewnLexicalProvider(dataset);
    const senses = await provider.lookup({ word: "  Uncle ", language: "en" });
    expect(senses).toMatchObject([
      {
        word: "uncle",
        senseId: "oewn-10755748-n",
        provenance: {
          sourceVersion: "2025",
          sourceId: "oewn-10755748-n",
          validationStatus: "verified",
        },
      },
    ]);
  });

  it("returns no facts for missing words or non-English lookups", async () => {
    const provider = new OewnLexicalProvider(dataset);
    await expect(provider.lookup({ word: "missing", language: "en" })).resolves.toEqual([]);
    await expect(provider.lookup({ word: "uncle", language: "pt" })).resolves.toEqual([]);
  });

  it("fails closed when a local index record is invalid", async () => {
    const provider = new OewnLexicalProvider({
      ...dataset,
      entries: { uncle: [{ ...dataset.entries.uncle[0], definition: "" }] },
    });
    await expect(provider.lookup({ word: "uncle", language: "en" })).rejects.toThrow();
  });
});
