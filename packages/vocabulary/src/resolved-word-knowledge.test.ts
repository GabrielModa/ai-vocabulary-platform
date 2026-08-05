import { describe, expect, it } from "vitest";
import type { LearningCandidate } from "./candidate-pipeline.js";
import type { ContentProvenance, LexicalContent } from "./content.js";
import { resolveCandidateKnowledge } from "./resolved-word-knowledge.js";

const provenance: ContentProvenance = {
  provider: "oewn",
  sourceId: "sense-affection",
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
    senseId: "sense-affection",
    partOfSpeech: "noun",
    definition: "A feeling of fondness or care.",
    provenance,
  },
  {
    word: "affection",
    normalizedWord: "affection",
    senseId: "sense-condition",
    partOfSpeech: "noun",
    definition: "A condition affecting part of the body.",
    provenance: { ...provenance, sourceId: "sense-condition" },
  },
];

function candidate(confirmedBy: "unique-provider-match" | "learner-selection"): LearningCandidate {
  return {
    candidateId: "candidate:affection:noun",
    displayForm: "affection",
    normalizedLemma: "affection",
    proposedPartOfSpeech: "noun",
    lexicalStatus: "verified",
    selectedSense: {
      senseId: "sense-affection",
      definition: "A feeling of fondness or care.",
      partOfSpeech: "noun",
      provenance,
      confirmedBy,
    },
    availableSenses: senses,
    selectionReasons: ["topic-match"],
  };
}

const context = {
  topic: "Love",
  learnerLevel: "B1",
  locale: "en-US",
};

describe("resolved word knowledge", () => {
  it("resolves a unique provider sense", () => {
    expect(
      resolveCandidateKnowledge({
        candidate: candidate("unique-provider-match"),
        context,
        exerciseCapabilities: ["definition-choice"],
      }),
    ).toMatchObject({
      ok: true,
      status: "resolved",
      knowledge: {
        decision: {
          resolution: "auto-selected",
          confidence: 1,
          decidedBy: "single-verified-sense",
        },
        exerciseCapabilities: ["definition-choice"],
      },
    });
  });

  it("records learner confirmation", () => {
    expect(
      resolveCandidateKnowledge({
        candidate: candidate("learner-selection"),
        context,
      }),
    ).toMatchObject({
      ok: true,
      status: "resolved",
      knowledge: {
        decision: {
          resolution: "learner-confirmed",
          decidedBy: "learner",
        },
      },
    });
  });

  it("keeps ambiguous candidates pending review", () => {
    const resolved = candidate("unique-provider-match");
    const ambiguous: LearningCandidate = {
      candidateId: resolved.candidateId,
      displayForm: resolved.displayForm,
      normalizedLemma: resolved.normalizedLemma,
      ...(resolved.proposedPartOfSpeech
        ? { proposedPartOfSpeech: resolved.proposedPartOfSpeech }
        : {}),
      lexicalStatus: "ambiguous",
      availableSenses: resolved.availableSenses,
      selectionReasons: resolved.selectionReasons,
    };

    expect(resolveCandidateKnowledge({ candidate: ambiguous, context })).toEqual({
      ok: true,
      status: "needs-review",
      candidateId: "candidate:affection:noun",
      availableSenseIds: ["sense-affection", "sense-condition"],
    });
  });

  it("keeps only examples for the selected sense", () => {
    const result = resolveCandidateKnowledge({
      candidate: candidate("learner-selection"),
      context,
      evidence: {
        examplesBySenseId: {
          "sense-affection": [
            {
              id: "example-affection",
              senseId: "sense-affection",
              sentence: "She showed affection for her family.",
              provenance,
            },
          ],
          "sense-condition": [
            {
              id: "example-condition",
              senseId: "sense-condition",
              sentence: "The condition required treatment.",
              provenance: { ...provenance, sourceId: "example-condition" },
            },
          ],
        },
      },
    });

    expect(result).toMatchObject({
      ok: true,
      status: "resolved",
      knowledge: {
        evidence: {
          officialExamples: [
            {
              id: "example-affection",
              senseId: "sense-affection",
            },
          ],
        },
      },
    });
  });
});
