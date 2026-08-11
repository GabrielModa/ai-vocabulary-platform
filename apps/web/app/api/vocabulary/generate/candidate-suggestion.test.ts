import { describe, expect, it, vi } from "vitest";
import type { LocalVocabularySet } from "@vocabulary/ai";
import { suggestCandidatesWithTrustedFirst } from "./candidate-suggestion";

const generatedByAi: LocalVocabularySet = {
  title: "Specialist vocabulary",
  candidates: [
    {
      term: "quark",
      type: "noun",
      meaning: "model output pending verification",
      example: "model output pending verification",
      challenge: "model output pending verification",
    },
  ],
};

describe("trusted-first candidate suggestion", () => {
  it("serves common-topic candidates without calling Ollama", async () => {
    const generate = vi.fn(() => Promise.resolve(generatedByAi));

    const result = await suggestCandidatesWithTrustedFirst(
      { topic: "soccer", level: "B1", requestedCount: 3 },
      { excludedTerms: [] },
      generate,
    );

    expect(generate).not.toHaveBeenCalled();
    expect(result.candidates.map(({ term, type }) => ({ term, type }))).toEqual([
      { term: "coach", type: "noun" },
      { term: "referee", type: "noun" },
      { term: "penalty", type: "noun" },
    ]);
  });

  it("honors exclusions before selecting local candidates", async () => {
    const generate = vi.fn(() => Promise.resolve(generatedByAi));
    const result = await suggestCandidatesWithTrustedFirst(
      { topic: "football", level: "B1", requestedCount: 2 },
      { excludedTerms: ["coach", "referee"] },
      generate,
    );

    expect(result.candidates.map(({ term }) => term)).toEqual(["penalty", "tackle"]);
    expect(generate).not.toHaveBeenCalled();
  });

  it("falls back with the same request and exclusions when the topic is unsupported", async () => {
    const generate = vi.fn(() => Promise.resolve(generatedByAi));
    const request = { topic: "quantum chromodynamics", level: "C2" as const, requestedCount: 1 };
    const options = { excludedTerms: ["boson"] };

    await expect(suggestCandidatesWithTrustedFirst(request, options, generate)).resolves.toBe(
      generatedByAi,
    );
    expect(generate).toHaveBeenCalledWith(request, options);
  });
});
