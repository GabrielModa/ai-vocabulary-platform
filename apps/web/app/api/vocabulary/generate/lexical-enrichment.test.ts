import { describe, expect, it } from "vitest";
import type { LocalVocabularySet } from "@vocabulary/ai";
import { enrichVocabularySet, type LexicalLookup } from "./lexical-enrichment.js";

const generated: LocalVocabularySet = {
  title: "Family vocabulary",
  candidates: [
    {
      term: "uncle",
      meaning: "a male relative",
      type: "noun",
      example: "My uncle visited us.",
      challenge: "My ___ visited us.",
    },
  ],
};

function lookup(results: readonly unknown[]): LexicalLookup {
  return { lookup: () => Promise.resolve(results) };
}

const familySense = {
  word: "uncle",
  normalizedWord: "uncle",
  senseId: "oewn-family-n",
  partOfSpeech: "noun",
  definition: "the brother of your father or mother; the husband of your aunt",
  provenance: {
    provider: "open-english-wordnet",
    sourceVersion: "2025",
    sourceId: "oewn-family-n",
    sourceUrl: "https://en-word.net/static/english-wordnet-2025-json.zip",
    license: "CC-BY-4.0",
    attribution: "Open English WordNet contributors",
    retrievedAt: "2026-08-03T00:00:00.000Z",
    generated: false,
    validationStatus: "verified",
  },
} as const;

describe("server lexical enrichment", () => {
  it("uses a canonical candidate with one compatible verified sense", async () => {
    const enriched = await enrichVocabularySet(generated, lookup([familySense]));
    expect(enriched).toMatchObject({ candidateStrategy: "suggest-verify-select" });
    expect(enriched.candidates[0]).toMatchObject({
      candidateId: "candidate:uncle:noun",
      normalizedLemma: "uncle",
      selectionReasons: ["suggested-by-local-ai", "matched-request-context"],
      meaning: familySense.definition,
      challenge: `Which word matches this meaning: "${familySense.definition}"? ___`,
      exerciseKind: "definition-choice",
      senseId: familySense.senseId,
      lexicalValidationStatus: "verified",
    });
  });

  it("does not guess when multiple compatible senses exist", async () => {
    const enriched = await enrichVocabularySet(
      generated,
      lookup([familySense, { ...familySense, senseId: "oewn-helper-n" }]),
    );
    expect(enriched.candidates[0]).toMatchObject({
      meaning: generated.candidates[0]?.meaning,
      lexicalValidationStatus: "provisional",
    });
    expect(enriched.candidates[0]).not.toHaveProperty("senseId");
  });

  it("marks missing facts as unavailable", async () => {
    const enriched = await enrichVocabularySet(generated, lookup([]));
    expect(enriched.candidates[0]).toMatchObject({ lexicalValidationStatus: "unavailable" });
  });

  it("fails soft when the local provider cannot be read", async () => {
    const enriched = await enrichVocabularySet(generated, {
      lookup: () => Promise.reject(new Error("invalid local index")),
    });
    expect(enriched.candidates[0]).toMatchObject({
      meaning: generated.candidates[0]?.meaning,
      lexicalValidationStatus: "unavailable",
    });
  });

  it("deduplicates normalized AI suggestions and exposes rejections", async () => {
    const originalCandidate = generated.candidates[0];
    if (!originalCandidate) throw new Error("expected generated candidate fixture");
    const duplicated: LocalVocabularySet = {
      ...generated,
      candidates: [originalCandidate, { ...originalCandidate, term: " UNCLE " }],
    };
    const enriched = await enrichVocabularySet(duplicated, lookup([familySense]));
    expect(enriched.candidates).toHaveLength(1);
    expect(enriched.rejectedCandidates).toEqual([
      { term: " UNCLE ", normalizedLemma: "uncle", reason: "duplicate-term" },
    ]);
  });
});
