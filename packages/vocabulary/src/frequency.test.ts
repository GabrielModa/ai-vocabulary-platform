import { describe, expect, it } from "vitest";
import { SubtlexFrequencyProvider } from "./frequency.js";

const dataset = {
  metadata: {
    provider: "subtlex-us",
    sourceVersion: "2.0",
    sourceUrl: "https://github.com/words/subtlex-word-frequencies",
    license: "ISC",
    attribution: "SUBTLEX-US authors and subtlex-word-frequencies contributors",
    retrievedAt: "2026-08-03T23:55:00.000Z",
    corpusSize: 51_000_000,
  },
  entries: {
    uncle: {
      count: 8_020,
      frequencyPerMillion: 157.254902,
      percentile: 0.72,
    },
  },
} as const;

describe("SUBTLEX frequency provider", () => {
  it("returns normalized verified frequency evidence", async () => {
    const provider = new SubtlexFrequencyProvider(dataset);

    await expect(provider.lookup({ word: " UNCLE ", language: "en-US" })).resolves.toMatchObject({
      normalizedWord: "uncle",
      count: 8_020,
      corpusSize: 51_000_000,
      frequencyPerMillion: 157.254902,
      percentile: 0.72,
      provenance: {
        provider: "subtlex-us",
        sourceId: "uncle",
        generated: false,
        validationStatus: "verified",
      },
    });
  });

  it("returns undefined for missing words", async () => {
    const provider = new SubtlexFrequencyProvider(dataset);

    await expect(
      provider.lookup({ word: "missingword", language: "en-US" }),
    ).resolves.toBeUndefined();
  });

  it("does not serve English evidence for another language", async () => {
    const provider = new SubtlexFrequencyProvider(dataset);

    await expect(provider.lookup({ word: "uncle", language: "pt-BR" })).resolves.toBeUndefined();
  });

  it("fails closed for malformed records", async () => {
    const provider = new SubtlexFrequencyProvider({
      ...dataset,
      entries: {
        uncle: {
          count: -1,
          frequencyPerMillion: 1,
          percentile: 0.5,
        },
      },
    });

    await expect(provider.lookup({ word: "uncle", language: "en-US" })).rejects.toThrow();
  });
});
