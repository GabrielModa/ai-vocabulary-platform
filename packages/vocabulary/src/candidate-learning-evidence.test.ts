import { describe, expect, it } from "vitest";
import { evaluateCandidateLearningEvidence } from "./candidate-learning-evidence.js";

describe("candidate learning evidence", () => {
  it("uses verified definition topic matches as strong relevance evidence", () => {
    expect(
      evaluateCandidateLearningEvidence({
        topic: "football",
        requestedLevel: "B1",
        normalizedLemma: "penalty",
        verifiedDefinition: "A free kick awarded in football after a serious foul.",
        verifiedExamples: [],
        selectionReasons: ["suggested-by-local-ai"],
        frequencyPercentile: 0.72,
      }),
    ).toMatchObject({
      topicRelevance: {
        score: 1,
        reasonCodes: ["verified-definition-topic-match"],
      },
      cefrEstimate: {
        level: "B1",
        status: "provisional",
        method: "subtlex-percentile-v1",
      },
      levelDistance: 0,
    });
  });

  it("uses verified examples as secondary topic evidence", () => {
    expect(
      evaluateCandidateLearningEvidence({
        topic: "airport travel",
        requestedLevel: "B2",
        normalizedLemma: "gate",
        verifiedDefinition: "An entrance through a wall or fence.",
        verifiedExamples: ["Passengers waited at the airport gate."],
        selectionReasons: [],
        frequencyPercentile: 0.55,
      }).topicRelevance,
    ).toEqual({ score: 0.75, reasonCodes: ["verified-example-topic-match"] });
  });

  it("keeps AI suggestion evidence weak and omits CEFR without frequency", () => {
    expect(
      evaluateCandidateLearningEvidence({
        topic: "football",
        requestedLevel: "A2",
        normalizedLemma: "whistle",
        verifiedDefinition: "A device that makes a high sound.",
        verifiedExamples: [],
        selectionReasons: ["matched-request-context"],
      }),
    ).toEqual({
      topicRelevance: { score: 0.25, reasonCodes: ["ai-topic-suggestion-only"] },
    });
  });

  it("reports normalized distance from a provisional frequency band", () => {
    expect(
      evaluateCandidateLearningEvidence({
        topic: "work",
        requestedLevel: "A2",
        normalizedLemma: "negotiate",
        verifiedDefinition: "To discuss in order to reach an agreement.",
        verifiedExamples: [],
        selectionReasons: [],
        frequencyPercentile: 0.35,
      }),
    ).toMatchObject({
      cefrEstimate: { level: "C1", confidence: 0.55 },
      levelDistance: 0.75,
    });
  });
});
