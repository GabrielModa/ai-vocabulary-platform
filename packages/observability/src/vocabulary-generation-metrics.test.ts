import { describe, expect, it } from "vitest";
import { normalizeVocabularyGenerationMetricFields } from "./vocabulary-generation-metrics.js";

describe("vocabulary generation metrics", () => {
  it("normalizes bounded performance and quality fields", () => {
    expect(
      normalizeVocabularyGenerationMetricFields({
        stage: "enrichment",
        outcome: "partial",
        durationMs: 19.7,
        requestedCount: 10,
        deliveredCount: 8,
        rejectedCount: 3,
        attemptCount: 2,
        cacheHit: true,
      }),
    ).toEqual({
      stage: "enrichment",
      outcome: "partial",
      durationMs: 20,
      requestedCount: 10,
      deliveredCount: 8,
      rejectedCount: 3,
      attemptCount: 2,
      cacheHit: true,
    });
  });

  it("bounds unknown enums and invalid counts", () => {
    expect(
      normalizeVocabularyGenerationMetricFields({
        stage: "user-topic",
        outcome: "provider-payload",
        durationMs: Number.NaN,
        requestedCount: -4,
        deliveredCount: 3.8,
        rejectedCount: Number.POSITIVE_INFINITY,
        attemptCount: 999,
        cacheHit: false,
      }),
    ).toEqual({
      stage: "unknown",
      outcome: "failed",
      durationMs: 0,
      requestedCount: 0,
      deliveredCount: 3,
      rejectedCount: 0,
      attemptCount: 10,
      cacheHit: false,
    });
  });

  it("accepts a successful intermediate stage", () => {
    expect(
      normalizeVocabularyGenerationMetricFields({
        stage: "candidate-suggestion",
        outcome: "succeeded",
        durationMs: 5,
        requestedCount: 6,
        deliveredCount: 6,
        rejectedCount: 0,
        attemptCount: 1,
        cacheHit: false,
      }).outcome,
    ).toBe("succeeded");
  });
});
