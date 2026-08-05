import { describe, expect, it, vi } from "vitest";
import type { LearningCandidate } from "./candidate-pipeline.js";
import type { ContentProvenance, LexicalContent } from "./content.js";
import {
  selectContextualSense,
  type ContextualSenseSelectorPort,
} from "./contextual-sense-selector.js";

const provenance: ContentProvenance = {
  provider: "oewn",
  sourceId: "sense-love",
  license: "CC BY 4.0",
  attribution: "Open English WordNet",
  retrievedAt: "2026-08-05T00:00:00.000Z",
  generated: false,
  validationStatus: "verified",
};

const loveSense: LexicalContent = {
  word: "affection",
  normalizedWord: "affection",
  senseId: "sense-love",
  partOfSpeech: "noun",
  definition: "A feeling of fondness or care.",
  provenance,
};

const medicalSense: LexicalContent = {
  word: "affection",
  normalizedWord: "affection",
  senseId: "sense-medical",
  partOfSpeech: "noun",
  definition: "A condition affecting the body.",
  provenance: { ...provenance, sourceId: "sense-medical" },
};

function candidate(senses: readonly LexicalContent[]): LearningCandidate {
  return {
    candidateId: "candidate:affection:noun",
    displayForm: "affection",
    normalizedLemma: "affection",
    proposedPartOfSpeech: "noun",
    lexicalStatus: senses.length === 1 ? "verified" : "ambiguous",
    availableSenses: senses,
    selectionReasons: ["suggested-by-local-ai"],
  };
}

const context = {
  topic: "Love",
  learnerLevel: "B1",
  locale: "en-US",
};

describe("contextual sense selector", () => {
  it("selects a single verified sense without calling AI", async () => {
    const select = vi.fn();
    const result = await selectContextualSense({
      candidate: candidate([loveSense]),
      context,
      selector: { select },
    });

    expect(select).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
      selectedSense: { senseId: "sense-love" },
      decision: {
        selectedSenseId: "sense-love",
        confidence: 1,
        decidedBy: "single-verified-sense",
      },
    });
  });

  it("asks AI to choose only among official senses", async () => {
    const select = vi.fn().mockResolvedValue({
      selectedSenseId: "sense-love",
      confidence: 0.96,
      reasonCodes: ["topic-match", "semantic-fit"],
    });
    const selector: ContextualSenseSelectorPort = { select };

    const result = await selectContextualSense({
      candidate: candidate([loveSense, medicalSense]),
      context,
      selector,
    });

    expect(select).toHaveBeenCalledWith({
      candidateId: "candidate:affection:noun",
      displayForm: "affection",
      normalizedLemma: "affection",
      proposedPartOfSpeech: "noun",
      context,
      allowedSenses: [
        {
          senseId: "sense-love",
          definition: "A feeling of fondness or care.",
          partOfSpeech: "noun",
        },
        {
          senseId: "sense-medical",
          definition: "A condition affecting the body.",
          partOfSpeech: "noun",
        },
      ],
    });
    expect(result).toMatchObject({
      ok: true,
      selectedSense: { senseId: "sense-love" },
      decision: {
        confidence: 0.96,
        decidedBy: "contextual-ai-selector",
      },
    });
  });

  it("rejects an invented sense ID", async () => {
    const result = await selectContextualSense({
      candidate: candidate([loveSense, medicalSense]),
      context,
      selector: {
        select: () =>
          Promise.resolve({
            selectedSenseId: "invented-sense",
            confidence: 0.99,
            reasonCodes: ["topic-match"],
          }),
      },
    });

    expect(result).toEqual({
      ok: false,
      code: "selected-sense-not-allowed",
      message: "The contextual selector chose a sense outside the allowed evidence",
    });
  });

  it("rejects extra generated lexical content", async () => {
    const result = await selectContextualSense({
      candidate: candidate([loveSense, medicalSense]),
      context,
      selector: {
        select: () =>
          Promise.resolve({
            selectedSenseId: "sense-love",
            confidence: 0.9,
            reasonCodes: ["topic-match"],
            definition: "An invented replacement definition.",
          }),
      },
    });

    expect(result).toMatchObject({
      ok: false,
      code: "invalid-selector-response",
    });
  });

  it("rejects invalid confidence and malformed output", async () => {
    const invalidConfidence = await selectContextualSense({
      candidate: candidate([loveSense, medicalSense]),
      context,
      selector: {
        select: () =>
          Promise.resolve({
            selectedSenseId: "sense-love",
            confidence: 2,
            reasonCodes: ["topic-match"],
          }),
      },
    });

    expect(invalidConfidence).toMatchObject({
      ok: false,
      code: "invalid-selector-response",
    });

    const malformed = await selectContextualSense({
      candidate: candidate([loveSense, medicalSense]),
      context,
      selector: {
        select: () => Promise.resolve("sense-love"),
      },
    });

    expect(malformed).toMatchObject({
      ok: false,
      code: "invalid-selector-response",
    });
  });

  it("requires a selector only for ambiguous candidates", async () => {
    expect(
      await selectContextualSense({
        candidate: candidate([loveSense, medicalSense]),
        context,
      }),
    ).toEqual({
      ok: false,
      code: "selector-unavailable",
      message: "A contextual selector is required for ambiguous candidates",
    });
  });
});
