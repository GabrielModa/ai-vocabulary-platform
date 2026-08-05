import { describe, expect, it } from "vitest";
import type { ContentProvenance, LexicalContent } from "./content.js";
import { createWordKnowledge } from "./lexical-knowledge.js";

const provenance: ContentProvenance = {
  provider: "oewn",
  sourceId: "sense-love-1",
  license: "CC BY 4.0",
  attribution: "Open English WordNet",
  retrievedAt: "2026-08-05T00:00:00.000Z",
  generated: false,
  validationStatus: "verified",
};

const senses: readonly LexicalContent[] = [
  {
    word: "affection",
    normalizedWord: "affection",
    senseId: "sense-love-1",
    partOfSpeech: "noun",
    definition: "A feeling of fondness or care.",
    provenance,
  },
  {
    word: "affection",
    normalizedWord: "affection",
    senseId: "sense-condition-2",
    partOfSpeech: "noun",
    definition: "A condition that affects a body part.",
    provenance: { ...provenance, sourceId: "sense-condition-2" },
  },
];

function input() {
  return {
    candidateId: "candidate:affection:noun",
    displayForm: "Affection",
    normalizedLemma: "affection",
    context: {
      topic: "Love",
      learnerLevel: "B1",
      locale: "en-US",
    },
    decision: {
      selectedSenseId: "sense-love-1",
      resolution: "auto-selected" as const,
      confidence: 0.96,
      reasonCodes: ["topic-match", "part-of-speech-match"],
      decidedBy: "contextual-ai-selector" as const,
    },
    evidence: {
      lexicalSenses: senses,
      officialExamples: [],
      pronunciations: [],
      cefrClassifications: [],
    },
    exerciseCapabilities: ["definition-choice" as const, "word-definition-match" as const],
  };
}

describe("word knowledge", () => {
  it("builds immutable knowledge from a selected evidence sense", () => {
    const result = createWordKnowledge(input());

    expect(result).toMatchObject({
      ok: true,
      knowledge: {
        version: "word-knowledge-v1",
        candidateId: "candidate:affection:noun",
        selectedSense: {
          senseId: "sense-love-1",
          definition: "A feeling of fondness or care.",
        },
        alternativeSenses: [{ senseId: "sense-condition-2" }],
        decision: {
          confidence: 0.96,
          decidedBy: "contextual-ai-selector",
        },
        exerciseCapabilities: ["definition-choice", "word-definition-match"],
      },
    });

    if (!result.ok) throw new Error("expected knowledge");
    expect(Object.isFrozen(result.knowledge)).toBe(true);
    expect(Object.isFrozen(result.knowledge.evidence)).toBe(true);
  });

  it("rejects a sense invented outside lexical evidence", () => {
    const result = createWordKnowledge({
      ...input(),
      decision: {
        ...input().decision,
        selectedSenseId: "invented-sense",
      },
    });

    expect(result).toEqual({
      ok: false,
      code: "selected-sense-not-found",
      message: "The selected sense must come from lexical evidence",
    });
  });

  it("rejects confidence outside the bounded contract", () => {
    const result = createWordKnowledge({
      ...input(),
      decision: { ...input().decision, confidence: 1.1 },
    });

    expect(result).toMatchObject({
      ok: false,
      code: "invalid-confidence",
    });
  });
});
