import { describe, expect, it } from "vitest";
import type { ContentProvenance, LexicalContent } from "./content.js";
import { publishDefinitionChoice } from "./definition-choice-publisher.js";
import { createWordKnowledge, type WordKnowledge } from "./lexical-knowledge.js";

const provenance: ContentProvenance = {
  provider: "oewn",
  sourceId: "test-source",
  license: "CC BY 4.0",
  attribution: "Open English WordNet",
  retrievedAt: "2026-08-05T00:00:00.000Z",
  generated: false,
  validationStatus: "verified",
};

function knowledge(
  word: string,
  definition: string,
  options?: {
    readonly partOfSpeech?: LexicalContent["partOfSpeech"];
  },
): WordKnowledge {
  const partOfSpeech = options?.partOfSpeech ?? "noun";
  const senseId = `sense:${word}`;
  const sense: LexicalContent = {
    word,
    normalizedWord: word.toLocaleLowerCase("en-US"),
    senseId,
    partOfSpeech,
    definition,
    provenance: {
      ...provenance,
      sourceId: senseId,
    },
  };
  const result = createWordKnowledge({
    candidateId: `candidate:${word}:${partOfSpeech}`,
    displayForm: word,
    normalizedLemma: word.toLocaleLowerCase("en-US"),
    context: {
      topic: "Love",
      learnerLevel: "B1",
      locale: "en-US",
    },
    decision: {
      selectedSenseId: senseId,
      resolution: "auto-selected",
      confidence: 0.95,
      reasonCodes: ["topic-match"],
      decidedBy: "contextual-ai-selector",
    },
    evidence: {
      lexicalSenses: [sense],
      officialExamples: [],
      pronunciations: [],
      cefrClassifications: [],
    },
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.knowledge;
}

const target = knowledge("affection", "A feeling of fondness or care.");
const agreement = knowledge("agreement", "A shared decision.");
const distance = knowledge("distance", "The space between two things.");
const permission = knowledge("permission", "Approval to do something.");
const pool = [agreement, distance, permission] as const;

describe("definition choice publisher", () => {
  it("publishes a complete definition-choice exercise", () => {
    const result = publishDefinitionChoice({
      target: {
        knowledge: target,
        frequencyPercentile: 0.6,
      },
      pool: pool.map((item, index) => ({
        knowledge: item,
        frequencyPercentile: 0.55 - index * 0.1,
      })),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.publication).toMatchObject({
      status: "published",
      strategy: "definition-choice",
      exercise: {
        kind: "definition-choice",
        knowledgeId: target.knowledgeId,
        prompt: "A feeling of fondness or care.",
      },
    });
    expect(result.publication.exercise.options.length).toBe(4);
    expect(result.publication.selectedDistractorKnowledgeIds.length).toBe(3);
    expect(result.publication.publicationId.startsWith("publication:")).toBe(true);
    expect(Object.isFrozen(result.publication)).toBe(true);
  });

  it("fails when fewer than three compatible distractors exist", () => {
    expect(
      publishDefinitionChoice({
        target: { knowledge: target },
        pool: [
          { knowledge: agreement },
          {
            knowledge: knowledge("admire", "To regard with respect.", { partOfSpeech: "verb" }),
          },
        ],
      }),
    ).toEqual({
      ok: false,
      code: "insufficient-compatible-knowledge",
      message: "Expected 3 compatible distractors",
    });
  });

  it("is deterministic for the same input", () => {
    const input = {
      target: { knowledge: target },
      pool: pool.map((knowledge) => ({
        knowledge,
      })),
    };

    expect(publishDefinitionChoice(input)).toEqual(publishDefinitionChoice(input));
  });

  it("retains the target lexical provenance", () => {
    const result = publishDefinitionChoice({
      target: { knowledge: target },
      pool: pool.map((knowledge) => ({
        knowledge,
      })),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.publication.exercise.provenance).toEqual(target.provenance);
  });
});
