import { describe, expect, it, vi } from "vitest";
import type { EnrichedVocabularySet } from "./lexical-enrichment";
import { resolveVocabularySetContextually } from "./contextual-lexical-enrichment";

const provenance = {
  provider: "open-english-wordnet",
  sourceVersion: "2025",
  sourceId: "sense-love",
  sourceUrl: "https://en-word.net",
  license: "CC-BY-4.0",
  attribution: "OEWN contributors",
  retrievedAt: "2026-08-05T00:00:00.000Z",
  generated: false,
  validationStatus: "verified",
} as const;

const vocabularySet: EnrichedVocabularySet = {
  title: "Love vocabulary",
  candidateStrategy: "suggest-verify-select",
  rankingStrategy: "deterministic-weighted-ranking",
  rejectedCandidates: [],
  candidates: [
    {
      term: "affection",
      meaning: "generated meaning",
      type: "noun",
      example: "Generated example.",
      challenge: "Generated ___.",
      candidateId: "candidate:affection:noun",
      normalizedLemma: "affection",
      selectionReasons: ["suggested-by-local-ai"],
      lexicalValidationStatus: "provisional",
      lexicalSenses: [
        {
          word: "affection",
          normalizedWord: "affection",
          senseId: "sense-love",
          partOfSpeech: "noun",
          definition: "A feeling of fondness or care.",
          provenance,
        },
        {
          word: "affection",
          normalizedWord: "affection",
          senseId: "sense-medical",
          partOfSpeech: "noun",
          definition: "A condition affecting the body.",
          provenance: {
            ...provenance,
            sourceId: "sense-medical",
          },
        },
      ],
      rank: 1,
      rankingScore: 15,
      rankingContributions: [{ reason: "ambiguous-sense", points: 15 }],
    },
  ],
};

describe("contextual lexical enrichment", () => {
  it("automatically resolves an ambiguous candidate", async () => {
    const select = vi.fn().mockResolvedValue({
      selectedSenseId: "sense-love",
      confidence: 0.95,
      reasonCodes: ["topic-match", "semantic-fit"],
    });

    const result = await resolveVocabularySetContextually(vocabularySet, {
      selector: { select },
      context: {
        topic: "Love",
        learnerLevel: "B1",
        locale: "en-US",
      },
    });

    expect(result.candidates[0]).toMatchObject({
      meaning: "A feeling of fondness or care.",
      lexicalValidationStatus: "verified",
      senseId: "sense-love",
      senseSelectionConfidence: 0.95,
      senseSelectionReasonCodes: ["topic-match", "semantic-fit"],
      senseSelectedBy: "contextual-ai-selector",
    });
  });

  it("keeps the manual fallback when selection fails", async () => {
    const result = await resolveVocabularySetContextually(vocabularySet, {
      selector: {
        select: () =>
          Promise.resolve({
            selectedSenseId: "invented",
            confidence: 0.99,
            reasonCodes: ["topic-match"],
          }),
      },
      context: {
        topic: "Love",
        learnerLevel: "B1",
        locale: "en-US",
      },
    });

    expect(result.candidates[0]).toMatchObject({
      meaning: "generated meaning",
      lexicalValidationStatus: "provisional",
    });
    expect(result.candidates[0]).not.toHaveProperty("senseId");
  });
});
