import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import type {
  ImageAnalysisCapability,
  PronunciationAssessmentCapability,
  SpeechSynthesisCapability,
  TranscriptionCapability,
} from "./capabilities.js";
import { AiCapabilityError, assertExecutionPolicy, type ExecutionPolicy } from "./execution.js";
import { DeterministicTextGenerationFake } from "./testing.js";
import { withTimeout } from "./timeout.js";
import { validateAiResult } from "./validation.js";

const policy: ExecutionPolicy = {
  privacy: "internal",
  cache: "eligible",
  timeoutMs: 1_000,
};
const versions = {
  model: "model-v1",
  prompt: "prompt-v1",
  schema: "schema-v1",
  policy: "policy-v1",
};

describe("provider-neutral AI contracts", () => {
  it("keeps every capability independently typed", () => {
    const capabilities = {
      image: { analyze: vi.fn() } satisfies ImageAnalysisCapability,
      speech: { synthesize: vi.fn() } satisfies SpeechSynthesisCapability,
      transcription: { transcribe: vi.fn() } satisfies TranscriptionCapability,
      pronunciation: { assess: vi.fn() } satisfies PronunciationAssessmentCapability,
    };
    expect(Object.keys(capabilities)).toEqual([
      "image",
      "speech",
      "transcription",
      "pronunciation",
    ]);
  });

  it("rejects structurally invalid output before a consumer receives it", () => {
    const invalidResult = {
      value: { labels: "not-an-array" },
      uncertainty: 0.2,
      usage: { inputUnits: 1, outputUnits: 1, unit: "images" as const },
      provenance: {
        provider: "fake",
        capability: "image-analysis" as const,
        versions,
        generatedAt: "2026-01-01T00:00:00.000Z",
      },
    };
    expect(() =>
      validateAiResult(z.object({ labels: z.array(z.string()) }), invalidResult),
    ).toThrow(AiCapabilityError);
  });

  it("preserves provenance versions and uncertainty in a deterministic fake consumer", async () => {
    const fake = new DeterministicTextGenerationFake({
      output: { text: "deterministic output" },
      uncertainty: 0.15,
    });
    const result = await fake.generate({ input: "input", locale: "en", policy, versions });
    expect(result.value.text).toBe("deterministic output");
    expect(result.uncertainty).toBe(0.15);
    expect(result.provenance.versions).toEqual(versions);
    expect(fake.requests).toHaveLength(1);
  });

  it("supports timeout and cancellation without provider details", async () => {
    vi.useFakeTimers();
    const pending = new Promise<string>(() => undefined);
    const timed = withTimeout(pending, 10);
    const timeoutExpectation = expect(timed).rejects.toMatchObject({ code: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(10);
    await timeoutExpectation;
    vi.useRealTimers();

    const controller = new AbortController();
    controller.abort();
    await expect(
      withTimeout(Promise.resolve("unused"), 10, controller.signal),
    ).rejects.toMatchObject({ code: "CANCELLED" });
  });

  it("rejects sensitive caching and exposes only safe error codes", () => {
    expect(() => {
      assertExecutionPolicy({ privacy: "sensitive", cache: "eligible", timeoutMs: 100 });
    }).toThrowError("AI capability failed: INVALID_OUTPUT");
    expect(() => {
      assertExecutionPolicy({ privacy: "sensitive", cache: "ineligible", timeoutMs: 100 });
    }).not.toThrow();
  });
});
