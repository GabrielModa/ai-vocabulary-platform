import { describe, expect, it, vi } from "vitest";
import type { LearningCandidate } from "./candidate-pipeline.js";
import type { ContentProvenance, LexicalContent } from "./content.js";
import {
  selectContextualSenseDeterministically,
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
  it("selects a clearly topic-bound verified sense without model inference", () => {
    expect(
      selectContextualSenseDeterministically({
        candidateId: "candidate:penalty:noun",
        displayForm: "penalty",
        normalizedLemma: "penalty",
        proposedPartOfSpeech: "noun",
        context: { topic: "football", learnerLevel: "A2", locale: "en-US" },
        allowedSenses: [
          {
            senseId: "sense:football",
            definition: "A free kick awarded in football after a serious foul.",
            partOfSpeech: "noun",
          },
          {
            senseId: "sense:punishment",
            definition: "A punishment imposed for breaking a law or rule.",
            partOfSpeech: "noun",
          },
        ],
      }),
    ).toEqual({
      selectedSenseId: "sense:football",
      confidence: 1,
      reasonCodes: ["weighted-topic-definition-match", "deterministic-verified-evidence"],
    });
  });

  it.each([
    [
      "coach",
      "sense:sports-coach",
      "(sports) someone in charge of training an athlete or a team",
      "a large comfortable bus used for long journeys",
    ],
    [
      "penalty",
      "sense:sports-penalty",
      "a disadvantage or punishment imposed for breaking a rule in a sport",
      "a payment required for breaking a legal agreement",
    ],
    [
      "tackle",
      "sense:sports-tackle",
      "seize and stop a player who is carrying the ball in a sport",
      "accept as a challenge and attempt to solve a difficult problem",
    ],
  ])(
    "selects the football sense of %s from reviewed semantic evidence",
    (term, senseId, sports, other) => {
      expect(
        selectContextualSenseDeterministically({
          candidateId: `candidate:${term}`,
          displayForm: term,
          normalizedLemma: term,
          context: { topic: "Football vocabulary", learnerLevel: "B1", locale: "en-US" },
          allowedSenses: [
            { senseId, definition: sports, partOfSpeech: term === "tackle" ? "verb" : "noun" },
            {
              senseId: `sense:${term}:other`,
              definition: other,
              partOfSpeech: term === "tackle" ? "verb" : "noun",
            },
          ],
        }),
      ).toMatchObject({ selectedSenseId: senseId, confidence: 1 });
    },
  );

  it("selects the football sense of formation from indirect spatial evidence", () => {
    expect(
      selectContextualSenseDeterministically({
        candidateId: "candidate:formation:noun",
        displayForm: "formation",
        normalizedLemma: "formation",
        proposedPartOfSpeech: "noun",
        context: { topic: "Football vocabulary", learnerLevel: "B2", locale: "en-US" },
        allowedSenses: [
          {
            senseId: "sense:unit-arrangement",
            definition: "an arrangement of people or things acting as a unit",
            partOfSpeech: "noun",
          },
          {
            senseId: "sense:fabrication",
            definition: "the act of fabricating something in a particular shape",
            partOfSpeech: "noun",
          },
          {
            senseId: "sense:establishment",
            definition: "the act of forming or establishing something",
            partOfSpeech: "noun",
          },
          {
            senseId: "sense:geology",
            definition: "(geology) the geological features of the earth",
            partOfSpeech: "noun",
          },
          {
            senseId: "sense:spatial-arrangement",
            definition: "a particular spatial arrangement",
            partOfSpeech: "noun",
          },
          {
            senseId: "sense:natural-process",
            definition: "natural process that causes something to form",
            partOfSpeech: "noun",
          },
          {
            senseId: "sense:mental-creation",
            definition: "creation by mental activity",
            partOfSpeech: "noun",
          },
        ],
      }),
    ).toEqual({
      selectedSenseId: "sense:spatial-arrangement",
      confidence: 1,
      reasonCodes: ["weighted-topic-definition-match", "deterministic-verified-evidence"],
    });
  });

  it.each([
    [
      "money",
      "bank",
      "sense:financial",
      "a financial institution that accepts deposits and lends money",
      "sloping land beside a river",
      "noun",
    ],
    [
      "travel",
      "connection",
      "sense:journey",
      "transport used to continue a journey toward a destination",
      "the state of being joined or linked",
      "noun",
    ],
    [
      "kitchen",
      "season",
      "sense:food",
      "add salt, herbs, or spices to food while cooking",
      "make wood suitable for use by drying it",
      "verb",
    ],
  ])(
    "selects an indirect verified sense for the %s domain",
    (topic, term, selectedSenseId, matchingDefinition, unrelatedDefinition, partOfSpeech) => {
      expect(
        selectContextualSenseDeterministically({
          candidateId: `candidate:${term}`,
          displayForm: term,
          normalizedLemma: term,
          context: { topic, learnerLevel: "B2", locale: "en-US" },
          allowedSenses: [
            { senseId: selectedSenseId, definition: matchingDefinition, partOfSpeech },
            {
              senseId: `sense:${term}:other`,
              definition: unrelatedDefinition,
              partOfSpeech,
            },
          ],
        }),
      ).toMatchObject({ selectedSenseId, confidence: 1 });
    },
  );

  it("keeps tied or weak contextual evidence for learner review", () => {
    const request = {
      candidateId: "candidate:score:verb",
      displayForm: "score",
      normalizedLemma: "score",
      proposedPartOfSpeech: "verb",
      context: { topic: "weekend activities", learnerLevel: "B1", locale: "en-US" },
      allowedSenses: [
        {
          senseId: "sense:points",
          definition: "To gain points in a game.",
          partOfSpeech: "verb",
        },
        {
          senseId: "sense:music",
          definition: "To write music for a film.",
          partOfSpeech: "verb",
        },
      ],
    } as const;

    expect(selectContextualSenseDeterministically(request)).toBeUndefined();
  });

  it("records deterministic context selection separately from AI selection", async () => {
    const result = await selectContextualSense({
      candidate: candidate([loveSense, medicalSense]),
      context,
      selector: {
        decidedBy: "deterministic-context-selector",
        select: () =>
          Promise.resolve({
            selectedSenseId: "sense-love",
            confidence: 1,
            reasonCodes: ["exact-topic-definition-match"],
          }),
      },
    });

    expect(result).toMatchObject({
      ok: true,
      decision: { decidedBy: "deterministic-context-selector" },
    });
  });

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

  it("keeps an AI decision below the calibrated threshold for learner review", async () => {
    const result = await selectContextualSense({
      candidate: candidate([loveSense, medicalSense]),
      context,
      selector: {
        select: () =>
          Promise.resolve({
            selectedSenseId: "sense-love",
            confidence: 0.94,
            reasonCodes: ["weak-topic-match"],
          }),
      },
    });

    expect(result).toMatchObject({ ok: false, code: "low-selector-confidence" });
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
