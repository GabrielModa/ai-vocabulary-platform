import { describe, expect, it } from "vitest";
import type { ContentProvenance, LexicalContent } from "./content.js";
import { mapDefinitionChoicePublication } from "./definition-choice-persistence-mapper.js";
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

function knowledge(word: string, definition: string): WordKnowledge {
  const senseId = `sense:${word}`;
  const sense: LexicalContent = {
    word,
    normalizedWord: word,
    senseId,
    partOfSpeech: "noun",
    definition,
    provenance: {
      ...provenance,
      sourceId: senseId,
    },
  };
  const result = createWordKnowledge({
    candidateId: `candidate:${word}:noun`,
    displayForm: word,
    normalizedLemma: word,
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

describe("definition choice persistence mapper", () => {
  it("maps a publication to the persistent exercise union", () => {
    const target = knowledge("affection", "A feeling of fondness or care.");
    const published = publishDefinitionChoice({
      target: { knowledge: target },
      pool: [
        {
          knowledge: knowledge("agreement", "A shared decision."),
        },
        {
          knowledge: knowledge("distance", "The space between two things."),
        },
        {
          knowledge: knowledge("permission", "Approval to do something."),
        },
      ],
    });

    expect(published.ok).toBe(true);
    if (!published.ok) return;

    const mapped = mapDefinitionChoicePublication(published.publication);

    expect(mapped.ok).toBe(true);
    if (!mapped.ok) return;

    expect(mapped.exercise).toMatchObject({
      exerciseKind: "definition-choice",
      candidateId: target.candidateId,
      knowledgeId: target.knowledgeId,
      senseId: target.selectedSense.senseId,
      prompt: "A feeling of fondness or care.",
      answer: "affection",
      compositionStrategy: "official-definition-deterministic-knowledge-distractors",
    });
    expect(mapped.exercise.options.length).toBe(4);
    expect(mapped.exercise.choiceIds.length).toBe(4);
    expect(mapped.exercise.provenance).toEqual(target.provenance);
    expect(Object.isFrozen(mapped.exercise)).toBe(true);
    expect(Object.isFrozen(mapped.exercise.options)).toBe(true);
  });
});
