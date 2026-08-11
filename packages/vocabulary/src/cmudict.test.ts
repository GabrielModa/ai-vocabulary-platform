import { describe, expect, it } from "vitest";
import { CmuPronunciationProvider } from "./cmudict.js";

const dataset = {
  metadata: {
    provider: "cmu-pronouncing-dictionary",
    sourceVersion: "0.7b",
    sourceUrl: "https://github.com/cmusphinx/cmudict",
    license: "CMUdict license",
    attribution: "Carnegie Mellon University",
    retrievedAt: "2026-08-11T00:00:00.000Z",
  },
  entries: {
    read: ["R IY1 D", ["R", "EH1", "D"]],
    uncle: ["AH1 NG K AH0 L"],
  },
} as const;

describe("CMUdict pronunciation provider", () => {
  it("normalizes words and preserves verified pronunciation variants", async () => {
    const provider = new CmuPronunciationProvider(dataset);

    await expect(provider.lookup({ word: "  READ ", dialect: "en-US" })).resolves.toMatchObject([
      {
        word: "read",
        dialect: "en-US",
        transcription: "R IY1 D",
        notation: "ARPABET",
        provenance: { sourceId: "read#1", validationStatus: "verified" },
      },
      {
        transcription: "R EH1 D",
        provenance: { sourceId: "read#2" },
      },
    ]);
  });

  it("returns no claim for an unknown word or unsupported dialect", async () => {
    const provider = new CmuPronunciationProvider(dataset);
    await expect(provider.lookup({ word: "missing", dialect: "en-US" })).resolves.toEqual([]);
    await expect(provider.lookup({ word: "uncle", dialect: "en-GB" })).resolves.toEqual([]);
  });

  it.each([
    ["unknown phoneme", "AH1 XX D"],
    ["vowel without stress", "AH N K AH0 L"],
    ["consonant with stress", "R1 IY1 D"],
    ["invalid stress", "R IY3 D"],
  ])("fails closed for %s", async (_label, transcription) => {
    const provider = new CmuPronunciationProvider({
      ...dataset,
      entries: { broken: [transcription] },
    });
    await expect(provider.lookup({ word: "broken", dialect: "en-US" })).rejects.toThrow();
  });
});
