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

function sourceCandidate(
  word: string,
  definitions: readonly string[],
  partOfSpeech: LexicalContent["partOfSpeech"] = "noun",
) {
  return {
    candidateId: `candidate:${word}:${partOfSpeech}`,
    term: word,
    normalizedLemma: word,
    type: partOfSpeech,
    lexicalValidationStatus: "verified" as const,
    lexicalSenses: definitions.map((definition, index): LexicalContent => ({
      word,
      normalizedWord: word,
      senseId: `sense:${word}:${String(index + 1)}`,
      partOfSpeech,
      definition,
      provenance: {
        ...provenance,
        sourceId: `sense:${word}:${String(index + 1)}`,
      },
    })),
  };
}

function contextResolvedSourceCandidate(
  word: string,
  selectedIndex: number,
  definitions: readonly string[],
) {
  const source = sourceCandidate(word, definitions);
  const senseId = source.lexicalSenses[selectedIndex]?.senseId;
  if (senseId === undefined) throw new Error("Expected a selected fixture sense");
  return { ...source, senseId };
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

  it("uses unambiguous verified source candidates as a supplemental distractor pool", () => {
    const target = candidate("player", "A person who takes part in a game.");

    const outcomes = publishReviewedDefinitionChoices({
      candidates: [target],
      sources: [
        { candidateId: target.candidateId },
        sourceCandidate("coach", ["A person who trains a team."]),
        sourceCandidate("referee", ["A person who enforces the rules."]),
        sourceCandidate("fan", ["A person who strongly supports a team."]),
        sourceCandidate("ball", ["A round object used in games."]),
      ],
      context: { topic: "Football", learnerLevel: "A2", locale: "en-US" },
    });

    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0]?.outcome;
    expect(outcome?.outcome).toBe("publish");
    if (outcome?.outcome !== "publish" || outcome.exercise.exerciseKind !== "definition-choice")
      return;

    expect([...outcome.exercise.options].sort()).toEqual(["coach", "fan", "player", "referee"]);
  });

  it("does not use ambiguous source candidates as supplemental distractors", () => {
    const target = candidate("player", "A person who takes part in a game.");

    const outcomes = publishReviewedDefinitionChoices({
      candidates: [target],
      sources: [
        { candidateId: target.candidateId },
        sourceCandidate("coach", ["A person who trains a team.", "A long-distance bus."]),
        sourceCandidate("referee", ["A person who enforces the rules."]),
        sourceCandidate("fan", ["A person who strongly supports a team."]),
        sourceCandidate("supporter", ["A person who supports a team."]),
      ],
      context: { topic: "Football", learnerLevel: "A2", locale: "en-US" },
    });

    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0]?.outcome;
    expect(outcome?.outcome).toBe("publish");
    if (outcome?.outcome !== "publish" || outcome.exercise.exerciseKind !== "definition-choice")
      return;

    expect(outcome.exercise.options).not.toContain("coach");
  });

  it("uses an official supplemental sense already resolved by trusted context", () => {
    const target = candidate("player", "A person who takes part in a game.");

    const outcomes = publishReviewedDefinitionChoices({
      candidates: [target],
      sources: [
        { candidateId: target.candidateId },
        contextResolvedSourceCandidate("coach", 0, [
          "A person who trains a team.",
          "A long-distance bus.",
        ]),
        contextResolvedSourceCandidate("referee", 0, [
          "A person who enforces the rules.",
          "A person asked to settle an academic dispute.",
        ]),
        contextResolvedSourceCandidate("fan", 0, [
          "A person who strongly supports a team.",
          "A device that moves air.",
        ]),
      ],
      context: { topic: "Football", learnerLevel: "B1", locale: "en-US" },
    });

    expect(outcomes[0]?.outcome.outcome).toBe("publish");
  });

  it("rotates definition distractors instead of repeating a fixed trio", () => {
    const words = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel"];
    const candidates = words.map((word) => candidate(word, `The verified meaning of ${word}.`));

    const outcomes = publishReviewedDefinitionChoices({
      candidates,
      sources: candidates.map(({ candidateId }) => ({ candidateId, frequencyPercentile: 0.5 })),
      context: { topic: "Education", learnerLevel: "B2", locale: "en-US" },
    });
    const published = outcomes.flatMap(({ outcome }) =>
      outcome.outcome === "publish" && outcome.exercise.exerciseKind === "definition-choice"
        ? [outcome.exercise]
        : [],
    );
    const distractorUsage = new Map<string, number>();
    for (const exercise of published) {
      for (const option of exercise.options) {
        if (option === exercise.answer) continue;
        distractorUsage.set(option, (distractorUsage.get(option) ?? 0) + 1);
      }
    }
    const counts = [...distractorUsage.values()];

    expect(published).toHaveLength(words.length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("publishes a ten-word mixed-POS set from a deeper verified reserve", () => {
    const nouns = [
      candidate("player", "A person who takes part in a sport."),
      candidate("coach", "A person responsible for training athletes."),
      candidate("referee", "An official who enforces the rules."),
      candidate("penalty", "A punishment imposed for breaking a rule."),
      candidate("formation", "The arrangement of athletes on the field."),
      candidate("team", "A group competing together in a sport."),
      candidate("match", "An organized contest between opponents."),
    ];
    const verbs = [
      candidate("score", "To gain a point in a game.", "verb"),
      candidate("tackle", "To challenge an opponent for possession.", "verb"),
      candidate("pass", "To send an object to another participant.", "verb"),
    ];
    const candidates = [...nouns, ...verbs];
    const supplementalNouns = ["teacher", "doctor", "ticket", "recipe", "budget"].map((word) =>
      sourceCandidate(word, [`The verified meaning of ${word}.`]),
    );
    const supplementalVerbs = ["learn", "recover", "afford", "repair", "recycle"].map((word) =>
      sourceCandidate(word, [`The verified action ${word}.`], "verb"),
    );

    const outcomes = publishReviewedDefinitionChoices({
      candidates,
      sources: [
        ...candidates.map(({ candidateId }) => ({ candidateId })),
        ...supplementalNouns,
        ...supplementalVerbs,
      ],
      context: { topic: "Football", learnerLevel: "B1", locale: "en-US" },
    });
    const published = outcomes.flatMap(({ outcome }) =>
      outcome.outcome === "publish" && outcome.exercise.exerciseKind === "definition-choice"
        ? [outcome.exercise]
        : [],
    );

    expect(
      outcomes
        .filter(({ outcome }) => outcome.outcome !== "publish")
        .map(({ candidateId }) => candidateId),
    ).toEqual([]);
    expect(published).toHaveLength(10);
    expect(
      new Set(published.map(({ options }) => [...options].sort().join("|"))).size,
    ).toBeGreaterThan(2);
    expect(
      published.every(
        ({ answer, options }) =>
          options.every(
            (option, index) => options.indexOf(option) === index && option.trim() !== "",
          ) && options.includes(answer),
      ),
    ).toBe(true);
  });
});
