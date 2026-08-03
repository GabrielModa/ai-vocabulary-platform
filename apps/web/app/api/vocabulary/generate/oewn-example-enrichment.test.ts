import { describe, expect, it } from "vitest";
import type { LocalVocabularySet } from "@vocabulary/ai";
import {
  enrichVocabularySet,
  type ExampleLookup,
  type LexicalLookup,
} from "./lexical-enrichment.js";

const generated: LocalVocabularySet = {
  title: "Sampling",
  candidates: [
    {
      term: "sample",
      meaning: "generated",
      type: "verb",
      example: "Generic generated example.",
      challenge: "Generic ___.",
    },
  ],
};

const sense = {
  word: "sample",
  normalizedWord: "sample",
  senseId: "oewn-01197832-v",
  partOfSpeech: "verb",
  definition: "take a sample of",
  provenance: {
    provider: "open-english-wordnet",
    sourceVersion: "2025",
    sourceId: "oewn-01197832-v",
    sourceUrl: "https://en-word.net/downloads/english-wordnet-2025-json.zip",
    license: "CC-BY-4.0",
    attribution: "Open English WordNet contributors",
    retrievedAt: "2026-08-03T23:58:00.000Z",
    generated: false,
    validationStatus: "verified",
  },
} as const;

const lexicalLookup: LexicalLookup = { lookup: () => Promise.resolve([sense]) };
const exampleLookup: ExampleLookup = {
  find: () =>
    Promise.resolve([
      {
        id: "oewn-01197832-v:example:1",
        senseId: "oewn-01197832-v",
        sentence: "Sample the regional dishes",
        provenance: { ...sense.provenance, sourceId: "oewn-01197832-v:example:1" },
      },
    ]),
};

describe("OEWN example enrichment", () => {
  it("replaces a generated example only with a verified example for the selected sense", async () => {
    const enriched = await enrichVocabularySet(generated, lexicalLookup, undefined, exampleLookup);
    expect(enriched.candidates[0]).toMatchObject({
      senseId: "oewn-01197832-v",
      example: "Sample the regional dishes",
      verifiedExamples: [{ senseId: "oewn-01197832-v", sentence: "Sample the regional dishes" }],
      exampleProvenance: { provider: "open-english-wordnet", validationStatus: "verified" },
    });
  });

  it("keeps the generated example when the example provider fails", async () => {
    const enriched = await enrichVocabularySet(generated, lexicalLookup, undefined, {
      find: () => Promise.reject(new Error("invalid examples index")),
    });
    expect(enriched.candidates[0]?.example).toBe("Generic generated example.");
    expect(enriched.candidates[0]).not.toHaveProperty("verifiedExamples");
  });

  it("does not request examples before a sense is uniquely selected", async () => {
    let requests = 0;
    const enriched = await enrichVocabularySet(
      generated,
      { lookup: () => Promise.resolve([sense, { ...sense, senseId: "oewn-other-v" }]) },
      undefined,
      {
        find: () => {
          requests += 1;
          return Promise.resolve([]);
        },
      },
    );
    expect(requests).toBe(0);
    expect(enriched.candidates[0]?.example).toBe("Generic generated example.");
  });
});
