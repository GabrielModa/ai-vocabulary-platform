import { describe, expect, it } from "vitest";
import type { ContentProvenance, LexicalContent } from "./content.js";
import { planExerciseCapabilities } from "./exercise-capability-planner.js";
import { createWordKnowledge, type WordKnowledge } from "./lexical-knowledge.js";

const provenance: ContentProvenance = {
  provider: "oewn",
  sourceId: "sense-affection",
  license: "CC BY 4.0",
  attribution: "Open English WordNet",
  retrievedAt: "2026-08-05T00:00:00.000Z",
  generated: false,
  validationStatus: "verified",
};

const sense: LexicalContent = {
  word: "affection",
  normalizedWord: "affection",
  senseId: "sense-affection",
  partOfSpeech: "noun",
  definition: "A feeling of fondness or care.",
  provenance,
};

function knowledge(options?: {
  readonly example?: string;
  readonly withPronunciation?: boolean;
}): WordKnowledge {
  const result = createWordKnowledge({
    candidateId: "candidate:affection:noun",
    displayForm: "Affection",
    normalizedLemma: "affection",
    context: {
      topic: "Love",
      learnerLevel: "B1",
      locale: "en-US",
    },
    decision: {
      selectedSenseId: "sense-affection",
      resolution: "auto-selected",
      confidence: 0.96,
      reasonCodes: ["topic-match"],
      decidedBy: "contextual-ai-selector",
    },
    evidence: {
      lexicalSenses: [sense],
      officialExamples: options?.example
        ? [
            {
              id: "example-affection",
              senseId: "sense-affection",
              sentence: options.example,
              provenance,
            },
          ]
        : [],
      pronunciations: options?.withPronunciation
        ? [
            {
              word: "affection",
              dialect: "en-US",
              transcription: "/əˈfekʃən/",
              notation: "IPA",
              provenance,
            },
          ]
        : [],
      cefrClassifications: [],
    },
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.knowledge;
}

describe("exercise capability planner", () => {
  it("enables definition strategies for resolved knowledge", () => {
    const plan = planExerciseCapabilities(knowledge());
    const unavailableCloze = plan.unavailable.find(
      ({ capability }) => capability === "verified-cloze",
    );

    expect(plan.available).toEqual(["definition-choice", "word-definition-match"]);
    expect(unavailableCloze).toEqual({
      capability: "verified-cloze",
      reason: "missing-target-bearing-official-example",
    });
  });

  it("enables cloze when an official example contains the target", () => {
    const plan = planExerciseCapabilities(
      knowledge({
        example: "She showed great affection for her family.",
      }),
    );
    const unavailableCloze = plan.unavailable.some(
      ({ capability }) => capability === "verified-cloze",
    );

    expect(plan.available.includes("verified-cloze")).toBe(true);
    expect(unavailableCloze).toBe(false);
  });

  it("does not enable cloze for an unrelated official sentence", () => {
    const plan = planExerciseCapabilities(
      knowledge({
        example: "She cared deeply for her family.",
      }),
    );
    const unavailableCloze = plan.unavailable.find(
      ({ capability }) => capability === "verified-cloze",
    );

    expect(plan.available.includes("verified-cloze")).toBe(false);
    expect(unavailableCloze).toEqual({
      capability: "verified-cloze",
      reason: "missing-target-bearing-official-example",
    });
  });

  it("matches the target as a complete lexical token", () => {
    const plan = planExerciseCapabilities(
      knowledge({
        example: "Her affectionate manner made everyone comfortable.",
      }),
    );

    expect(plan.available.includes("verified-cloze")).toBe(false);
  });

  it("enables audio recognition only with pronunciation evidence", () => {
    const withoutAudio = planExerciseCapabilities(knowledge());
    const withAudio = planExerciseCapabilities(knowledge({ withPronunciation: true }));

    expect(withoutAudio.available.includes("audio-recognition")).toBe(false);
    expect(withAudio.available.includes("audio-recognition")).toBe(true);
  });

  it("returns immutable deterministic plans", () => {
    const first = planExerciseCapabilities(knowledge());
    const second = planExerciseCapabilities(knowledge());

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.available)).toBe(true);
    expect(Object.isFrozen(first.unavailable)).toBe(true);
    expect(first.knowledgeId.includes("candidate%3Aaffection%3Anoun")).toBe(true);
  });
});
