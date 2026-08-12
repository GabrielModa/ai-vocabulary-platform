import { describe, expect, it } from "vitest";
import type { ContentProvenance, LexicalContent } from "./content.js";
import { selectDefinitionChoiceDistractors } from "./definition-choice-distractor-selector.js";
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
    readonly topic?: string;
    readonly learnerLevel?: "A2" | "B1" | "B2" | "C1" | "C2";
    readonly senseId?: string;
  },
): WordKnowledge {
  const partOfSpeech = options?.partOfSpeech ?? "noun";
  const senseId = options?.senseId ?? `sense:${word}`;
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
      topic: options?.topic ?? "Love",
      learnerLevel: options?.learnerLevel ?? "B1",
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

describe("definition choice distractor selector", () => {
  it("selects exactly three compatible resolved knowledge items", () => {
    const agreement = knowledge("agreement", "A shared decision.");
    const distance = knowledge("distance", "The space between two things.");
    const permission = knowledge("permission", "Approval to do something.");

    const result = selectDefinitionChoiceDistractors({
      target: {
        knowledge: target,
        frequencyPercentile: 0.6,
      },
      pool: [
        {
          knowledge: permission,
          frequencyPercentile: 0.2,
        },
        {
          knowledge: agreement,
          frequencyPercentile: 0.58,
        },
        {
          knowledge: distance,
          frequencyPercentile: 0.55,
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.distractors.length).toBe(3);
    expect(result.distractors.map(({ knowledge: item }) => item.displayForm)).toEqual([
      "agreement",
      "distance",
      "permission",
    ]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.distractors)).toBe(true);
  });

  it("excludes target, duplicate lemmas, senses, definitions, and parts of speech", () => {
    const validItems = [
      knowledge("agreement", "A shared decision."),
      knowledge("distance", "The space between two things."),
      knowledge("permission", "Approval to do something."),
    ];
    const duplicateLemma = knowledge("Affection", "A different definition.", {
      senseId: "sense:affection-2",
    });
    const duplicateSense = knowledge("fondness", "A warm feeling.", { senseId: "sense:affection" });
    const duplicateDefinition = knowledge("care", "A feeling of fondness or care.");
    const wrongPartOfSpeech = knowledge("admire", "To regard with respect.", {
      partOfSpeech: "verb",
    });

    const result = selectDefinitionChoiceDistractors({
      target: { knowledge: target },
      pool: [
        { knowledge: target },
        { knowledge: duplicateLemma },
        { knowledge: duplicateSense },
        { knowledge: duplicateDefinition },
        { knowledge: wrongPartOfSpeech },
        ...validItems.map((item) => ({
          knowledge: item,
        })),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.distractors.map(({ knowledge: item }) => item.displayForm)).toEqual([
      "agreement",
      "distance",
      "permission",
    ]);
  });

  it("uses stable knowledge ID ordering to break equal scores", () => {
    const first = knowledge("alpha", "First concept.");
    const second = knowledge("bravo", "Second concept.");
    const third = knowledge("delta", "Third concept.");

    const result = selectDefinitionChoiceDistractors({
      target: { knowledge: target },
      pool: [{ knowledge: third }, { knowledge: second }, { knowledge: first }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.distractors.map(({ knowledge: item }) => item.normalizedLemma)).toEqual([
      "alpha",
      "bravo",
      "delta",
    ]);
  });

  it("does not fill a same-POS deficit with cross-POS distractors", () => {
    const referee = knowledge("referee", "An official who enforces the rules.");
    const coach = knowledge("coach", "A person who trains a team.");
    const penalty = knowledge("penalty", "A punishment for breaking a rule.");
    const tackle = knowledge("tackle", "To stop an opponent by challenging for the ball.", {
      partOfSpeech: "verb",
    });

    const result = selectDefinitionChoiceDistractors({
      target: { knowledge: referee, frequencyPercentile: 0.6 },
      pool: [
        { knowledge: tackle, frequencyPercentile: 0.45 },
        { knowledge: penalty, frequencyPercentile: 0.5 },
        { knowledge: coach, frequencyPercentile: 0.55 },
      ],
    });

    expect(result).toEqual({
      ok: false,
      code: "insufficient-compatible-knowledge",
      message: "Expected 3 compatible distractors",
      compatibleKnowledgeCount: 1,
    });
  });

  it("reports the number of compatible items when the pool is insufficient", () => {
    const result = selectDefinitionChoiceDistractors({
      target: { knowledge: target },
      pool: [
        {
          knowledge: knowledge("agreement", "A shared decision."),
        },
        {
          knowledge: knowledge("admire", "To regard with respect.", { partOfSpeech: "verb" }),
        },
      ],
    });

    expect(result).toEqual({
      ok: false,
      code: "insufficient-compatible-knowledge",
      message: "Expected 3 compatible distractors",
      compatibleKnowledgeCount: 1,
    });
  });

  it("validates a custom requested count", () => {
    expect(
      selectDefinitionChoiceDistractors({
        target: { knowledge: target },
        pool: [],
        count: 0,
      }),
    ).toEqual({
      ok: false,
      code: "invalid-distractor-count",
      message: "Distractor count must be a positive safe integer",
      compatibleKnowledgeCount: 0,
    });
  });

  it("rejects same-topic nouns that reveal the answer through semantic category", () => {
    const ball = knowledge("ball", "A round object that is hit or thrown or kicked in games.", {
      topic: "football",
      learnerLevel: "A2",
    });
    const match = knowledge(
      "match",
      "A formal contest in which two or more persons or teams compete.",
      {
        topic: "football",
        learnerLevel: "A2",
      },
    );
    const player = knowledge("player", "A person who participates in or is skilled at some game.", {
      topic: "football",
      learnerLevel: "A2",
    });
    const team = knowledge("team", "A cooperative unit especially in sports.", {
      topic: "football",
      learnerLevel: "A2",
    });

    const result = selectDefinitionChoiceDistractors({
      target: { knowledge: ball },
      pool: [{ knowledge: match }, { knowledge: player }, { knowledge: team }],
    });

    expect(result).toEqual({
      ok: false,
      code: "insufficient-compatible-knowledge",
      message: "Expected 3 compatible distractors",
      compatibleKnowledgeCount: 0,
    });
  });

  it("keeps concrete distractors in the same semantic role", () => {
    const referee = knowledge("referee", "A person who enforces the rules.", {
      topic: "football",
      learnerLevel: "A2",
    });
    const coach = knowledge("coach", "A person who trains a team.", {
      topic: "football",
      learnerLevel: "A2",
    });
    const fan = knowledge("fan", "A person who strongly supports a team.", {
      topic: "football",
      learnerLevel: "A2",
    });
    const player = knowledge("player", "A person who takes part in a game.", {
      topic: "football",
      learnerLevel: "A2",
    });
    const ball = knowledge("ball", "A round object used in games.", {
      topic: "football",
      learnerLevel: "A2",
    });

    const result = selectDefinitionChoiceDistractors({
      target: { knowledge: referee },
      pool: [{ knowledge: ball }, { knowledge: coach }, { knowledge: fan }, { knowledge: player }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.distractors.map(({ knowledge: item }) => item.displayForm).sort()).toEqual([
      "coach",
      "fan",
      "player",
    ]);

    expect(result.distractors.every(({ reasons }) => reasons.includes("same-semantic-role"))).toBe(
      true,
    );
  });
});
