import type {
  ContentProvenance,
  LearningCandidate,
  LexicalContent,
} from "@vocabulary/domain-vocabulary";
import { describe, expect, it } from "vitest";
import { publishReviewedDefinitionChoices } from "./reviewed-definition-choice-publication";

const provenance: ContentProvenance = {
  provider: "oewn",
  sourceId: "test-source",
  license: "CC BY 4.0",
  attribution: "Open English WordNet",
  retrievedAt: "2026-08-05T00:00:00.000Z",
  generated: false,
  validationStatus: "verified",
};

function candidate(
  word: string,
  definition: string,
  partOfSpeech: LexicalContent["partOfSpeech"] = "noun",
): LearningCandidate {
  const sense: LexicalContent = {
    word,
    normalizedWord: word,
    senseId: `sense:${word}`,
    partOfSpeech,
    definition,
    provenance: {
      ...provenance,
      sourceId: `sense:${word}`,
    },
  };

  return {
    candidateId: `candidate:${word}:${partOfSpeech}`,
    displayForm: word,
    normalizedLemma: word,
    proposedPartOfSpeech: partOfSpeech,
    lexicalStatus: "verified",
    selectedSense: {
      senseId: sense.senseId,
      definition,
      partOfSpeech,
      provenance: sense.provenance,
      confirmedBy: "learner-selection",
    },
    availableSenses: [sense],
    selectionReasons: ["reviewed"],
  };
}

describe("reviewed definition-choice publication", () => {
  it("publishes definition choices for a compatible reviewed pool", () => {
    const candidates = [
      candidate("affection", "A feeling of fondness or care."),
      candidate("agreement", "A shared decision."),
      candidate("distance", "The space between two things."),
      candidate("permission", "Approval to do something."),
    ];

    const outcomes = publishReviewedDefinitionChoices({
      candidates,
      sources: candidates.map(({ candidateId }, index) => ({
        candidateId,
        frequencyPercentile: 0.6 - index * 0.1,
      })),
      context: {
        topic: "Love",
        learnerLevel: "B1",
        locale: "en-US",
      },
    });

    expect(outcomes).toHaveLength(4);
    expect(
      outcomes.every(
        ({ outcome }) =>
          outcome.outcome === "publish" && outcome.exercise.exerciseKind === "definition-choice",
      ),
    ).toBe(true);
  });

  it("rejects publication when the reviewed pool is too small", () => {
    const candidates = [
      candidate("affection", "A feeling of fondness or care."),
      candidate("agreement", "A shared decision."),
    ];

    expect(
      publishReviewedDefinitionChoices({
        candidates,
        sources: candidates.map(({ candidateId }) => ({ candidateId })),
        context: {
          topic: "Love",
          learnerLevel: "B1",
          locale: "en-US",
        },
      }).map(({ outcome }) => outcome.outcome),
    ).toEqual(["reject", "reject"]);
  });

  it("rejects a mixed-POS reviewed set when credible same-POS distractors are unavailable", () => {
    const candidates = [
      candidate("referee", "An official who enforces the rules."),
      candidate("coach", "A person who trains a team."),
      candidate("penalty", "A punishment for breaking a rule."),
      candidate("tackle", "To stop an opponent by challenging for the ball.", "verb"),
    ];

    const outcomes = publishReviewedDefinitionChoices({
      candidates,
      sources: candidates.map(({ candidateId }) => ({ candidateId })),
      context: { topic: "Football", learnerLevel: "B1", locale: "en-US" },
    });

    expect(outcomes.map(({ outcome }) => outcome.outcome)).toEqual([
      "reject",
      "reject",
      "reject",
      "reject",
    ]);
  });
});
