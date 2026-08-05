import { describe, expect, it } from "vitest";
import type { ContentProvenance, LexicalContent } from "./content.js";
import { mapDefinitionChoicePublication } from "./definition-choice-persistence-mapper.js";
import { publishDefinitionChoice } from "./definition-choice-publisher.js";
import { createWordKnowledge, type WordKnowledge } from "./lexical-knowledge.js";
import { buildStudySessionSnapshot } from "./study-session-snapshot.js";

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
    provenance,
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

describe("definition choice study session snapshot", () => {
  it("includes a mapped definition-choice publication", () => {
    const target = knowledge("affection", "A feeling of fondness or care.");
    const publication = publishDefinitionChoice({
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

    expect(publication.ok).toBe(true);
    if (!publication.ok) return;

    const mapped = mapDefinitionChoicePublication(publication.publication);
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) return;

    const result = buildStudySessionSnapshot({
      title: "Love vocabulary",
      level: "B1",
      createdAt: "2026-08-05T20:00:00.000Z",
      selectedCandidateIds: [target.candidateId],
      candidates: [
        {
          candidateId: target.candidateId,
          outcome: {
            outcome: "publish",
            exercise: mapped.exercise,
          },
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot.exercises[0]).toMatchObject({
      exerciseKind: "definition-choice",
      candidateId: target.candidateId,
      knowledgeId: target.knowledgeId,
      prompt: "A feeling of fondness or care.",
      answer: "affection",
    });
    expect(result.snapshot.exercises[0]?.options.length).toBe(4);
  });
});
