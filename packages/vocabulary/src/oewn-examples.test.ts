import { describe, expect, it } from "vitest";
import { OewnExampleProvider } from "./oewn-examples.js";

const dataset = {
  metadata: {
    provider: "open-english-wordnet",
    sourceVersion: "2025",
    sourceUrl: "https://en-word.net/downloads/english-wordnet-2025-json.zip",
    license: "CC-BY-4.0",
    attribution: "Open English WordNet contributors",
    retrievedAt: "2026-08-03T23:58:00.000Z",
  },
  entries: {
    "oewn-01197832-v": ["Try these new crackers", "Sample the regional dishes"],
  },
} as const;

describe("OEWN example provider", () => {
  it("returns all verified examples bound to one sense", async () => {
    const provider = new OewnExampleProvider(dataset);
    const examples = await provider.find({ senseId: "oewn-01197832-v" });

    expect(examples).toHaveLength(2);
    expect(examples[0]).toMatchObject({
      id: "oewn-01197832-v:example:1",
      senseId: "oewn-01197832-v",
      sentence: "Try these new crackers",
      provenance: {
        provider: "open-english-wordnet",
        sourceId: "oewn-01197832-v:example:1",
        generated: false,
        validationStatus: "verified",
      },
    });
    expect(examples[1]).toMatchObject({
      id: "oewn-01197832-v:example:2",
      sentence: "Sample the regional dishes",
    });
  });

  it("returns an empty list for a sense without examples", async () => {
    const provider = new OewnExampleProvider(dataset);
    await expect(provider.find({ senseId: "oewn-missing-n" })).resolves.toEqual([]);
  });

  it("fails closed for malformed example records", async () => {
    const provider = new OewnExampleProvider({
      ...dataset,
      entries: { "oewn-01197832-v": [""] },
    });

    await expect(provider.find({ senseId: "oewn-01197832-v" })).rejects.toThrow();
  });

  it("does not mutate the source dataset", async () => {
    const provider = new OewnExampleProvider(dataset);
    await provider.find({ senseId: "oewn-01197832-v" });
    expect(dataset.entries["oewn-01197832-v"]).toEqual([
      "Try these new crackers",
      "Sample the regional dishes",
    ]);
  });
});
