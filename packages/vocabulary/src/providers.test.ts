import { describe, expect, it } from "vitest";
import {
  cefrClassificationSchema,
  exampleContentSchema,
  pronunciationContentSchema,
} from "./providers.js";

const source = {
  provider: "licensed-corpus",
  sourceId: "example-1",
  license: "CC-BY-2.0",
  attribution: "Corpus contributor",
  retrievedAt: "2026-08-03T00:00:00.000Z",
  generated: false,
  validationStatus: "verified",
} as const;

describe("content provider result contracts", () => {
  it("allows audio when no reliable transcription is available", () => {
    expect(
      pronunciationContentSchema.parse({
        word: "uncle",
        dialect: "en-US",
        audioReference: "audio_opaque_1",
        provenance: source,
      }),
    ).not.toHaveProperty("transcription");
  });

  it("rejects pronunciation records with neither audio nor transcription", () => {
    expect(() =>
      pronunciationContentSchema.parse({ word: "uncle", dialect: "en-US", provenance: source }),
    ).toThrow();
  });

  it("keeps an adapted example separate from its licensed original", () => {
    const example = exampleContentSchema.parse({
      id: "adapted-example-1",
      senseId: "sense-1",
      sentence: "My mother's brother is my uncle.",
      original: {
        sentence: "My uncle is my mother's brother.",
        provenance: source,
      },
      provenance: {
        provider: "local-ai",
        retrievedAt: "2026-08-03T00:01:00.000Z",
        generated: true,
        adaptedFrom: "example-1",
        validationStatus: "provisional",
      },
    });
    expect(example.original?.sentence).not.toBe(example.sentence);
  });

  it("requires CEFR classifications to target a lexical sense", () => {
    expect(() =>
      cefrClassificationSchema.parse({
        level: "A2",
        provenance: source,
      }),
    ).toThrow();
  });
});
