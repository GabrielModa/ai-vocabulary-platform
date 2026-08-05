import { describe, expect, it } from "vitest";
import type { ContentProvenance, LexicalContent } from "./content.js";
import { composeDefinitionChoice } from "./definition-choice-composer.js";
import { planExerciseCapabilities } from "./exercise-capability-planner.js";
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
  partOfSpeech: LexicalContent["partOfSpeech"] = "noun",
): WordKnowledge {
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
const distractors = [
  knowledge("agreement", "A shared decision."),
  knowledge("distance", "The space between two things."),
  knowledge("permission", "Approval to do something."),
] as const;

describe("definition choice composer", () => {
  it("composes an immutable exercise from official knowledge", () => {
    const result = composeDefinitionChoice({
      knowledge: target,
      capabilityPlan: planExerciseCapabilities(target),
      distractors,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.exercise).toEqual({
      exerciseId: `exercise:${encodeURIComponent(target.knowledgeId)}:definition-choice:v1`,
      kind: "definition-choice",
      candidateId: target.candidateId,
      knowledgeId: target.knowledgeId,
      senseId: "sense:affection",
      prompt: "A feeling of fondness or care.",
      options: [
        {
          choiceId: `choice:${encodeURIComponent(target.knowledgeId)}`,
          label: "affection",
          knowledgeId: target.knowledgeId,
        },
        {
          choiceId: `choice:${encodeURIComponent(distractors[0].knowledgeId)}`,
          label: "agreement",
          knowledgeId: distractors[0].knowledgeId,
        },
        {
          choiceId: `choice:${encodeURIComponent(distractors[1].knowledgeId)}`,
          label: "distance",
          knowledgeId: distractors[1].knowledgeId,
        },
        {
          choiceId: `choice:${encodeURIComponent(distractors[2].knowledgeId)}`,
          label: "permission",
          knowledgeId: distractors[2].knowledgeId,
        },
      ],
      correctChoiceId: `choice:${encodeURIComponent(target.knowledgeId)}`,
      provenance: target.provenance,
    });
    expect(Object.isFrozen(result.exercise)).toBe(true);
    expect(Object.isFrozen(result.exercise.options)).toBe(true);
  });

  it("rejects composition when the capability is unavailable", () => {
    const plan = {
      ...planExerciseCapabilities(target),
      available: [],
    };

    expect(
      composeDefinitionChoice({
        knowledge: target,
        capabilityPlan: plan,
        distractors,
      }),
    ).toEqual({
      ok: false,
      code: "capability-unavailable",
      message: "Definition choice is not supported by this lexical knowledge",
    });
  });

  it("requires exactly three unique distractors", () => {
    expect(
      composeDefinitionChoice({
        knowledge: target,
        capabilityPlan: planExerciseCapabilities(target),
        distractors: distractors.slice(0, 2),
      }),
    ).toMatchObject({
      ok: false,
      code: "invalid-distractor-count",
    });

    expect(
      composeDefinitionChoice({
        knowledge: target,
        capabilityPlan: planExerciseCapabilities(target),
        distractors: [distractors[0], distractors[1], target],
      }),
    ).toMatchObject({
      ok: false,
      code: "duplicate-choice",
    });
  });

  it("rejects distractors with a different part of speech", () => {
    const verb = knowledge("admire", "To regard with respect.", "verb");

    expect(
      composeDefinitionChoice({
        knowledge: target,
        capabilityPlan: planExerciseCapabilities(target),
        distractors: [distractors[0], distractors[1], verb],
      }),
    ).toEqual({
      ok: false,
      code: "part-of-speech-mismatch",
      message: "Definition choice distractors must share the target part of speech",
    });
  });

  it("rejects a capability plan from another knowledge item", () => {
    expect(
      composeDefinitionChoice({
        knowledge: target,
        capabilityPlan: planExerciseCapabilities(distractors[0]),
        distractors,
      }),
    ).toMatchObject({
      ok: false,
      code: "capability-unavailable",
    });
  });
});
