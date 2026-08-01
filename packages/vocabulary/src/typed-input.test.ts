import { describe, expect, it } from "vitest";
import {
  DeterministicTypedCandidateAnalyzer,
  FixedLanguageDetector,
  SequentialCandidateIdFactory,
} from "./testing.js";
import { createTypedCollection, parseTypedEntries, TypedInputError } from "./typed-input.js";

function dependencies(language = "pt-BR", outputOverride?: unknown) {
  return {
    languageDetector: new FixedLanguageDetector(language),
    analyzer: new DeterministicTypedCandidateAnalyzer(
      { campo: "pitch", chute: "shot", goleiro: "goalkeeper" },
      outputOverride,
    ),
    candidateIds: new SequentialCandidateIdFactory(),
  };
}

const baseRequest = {
  collectionId: "collection_1",
  ownerId: "learner_1",
  title: "My words",
  text: "campo, chute; goleiro",
  level: "B1" as const,
};

describe("typed-word candidate pipeline", () => {
  it("parses separators, preserves phrases and order, and removes normalized duplicates", () => {
    expect(parseTypedEntries("take off, goalkeeper\n  football   pitch ; TAKE OFF")).toEqual([
      "take off",
      "goalkeeper",
      "football pitch",
    ]);
  });

  it("detects non-English input and creates only proposed candidates", async () => {
    const ports = dependencies();
    const collection = await createTypedCollection(baseRequest, ports);
    expect(ports.languageDetector.inputs).toEqual([baseRequest.text]);
    expect(collection.source).toEqual({ type: "text", text: baseRequest.text, language: "pt-BR" });
    expect(collection.status).toBe("draft");
    expect(
      collection.candidates.map(({ englishTerm, status }) => ({ englishTerm, status })),
    ).toEqual([
      { englishTerm: "pitch", status: "proposed" },
      { englishTerm: "shot", status: "proposed" },
      { englishTerm: "goalkeeper", status: "proposed" },
    ]);
  });

  it("accepts explicit English without invoking language detection", async () => {
    const ports = dependencies("unused");
    const collection = await createTypedCollection(
      { ...baseRequest, text: "football pitch, take off", language: "en" },
      ports,
    );
    expect(ports.languageDetector.inputs).toEqual([]);
    expect(collection.candidates.map((candidate) => candidate.englishTerm)).toEqual([
      "football pitch",
      "take off",
    ]);
  });

  it("rejects empty, long, and more than 100 entries without truncation", () => {
    expect(() => parseTypedEntries(" , ; \n ")).toThrowError(
      "Typed vocabulary input failed: EMPTY_INPUT",
    );
    expect(() => parseTypedEntries("x".repeat(201))).toThrowError(
      "Typed vocabulary input failed: INPUT_TOO_LARGE",
    );
    expect(() =>
      parseTypedEntries(
        Array.from({ length: 101 }, (_, index) => `word${String(index)}`).join(","),
      ),
    ).toThrowError("Typed vocabulary input failed: INPUT_TOO_LARGE");
  });

  it.each([
    { invalid: true },
    [],
    [
      {
        sourceTerm: "wrong order",
        englishTerm: "wrong",
        sourceLanguage: "en",
        sense: "wrong sense",
        partOfSpeech: "other",
      },
    ],
  ])("rejects invalid, missing, or mismatched analyzer output", async (output) => {
    await expect(createTypedCollection(baseRequest, dependencies("pt-BR", output))).rejects.toEqual(
      new TypedInputError("INVALID_ANALYSIS"),
    );
  });

  it("is deterministic for the same input and fake configuration", async () => {
    const first = await createTypedCollection(baseRequest, dependencies());
    const second = await createTypedCollection(baseRequest, dependencies());
    expect(first).toEqual(second);
  });

  it("returns safe errors without learner-entered content", async () => {
    const privateText = "private learner text";
    try {
      await createTypedCollection(
        { ...baseRequest, text: privateText },
        dependencies("invalid language value"),
      );
    } catch (error) {
      expect(String(error)).toBe(
        "TypedInputError: Typed vocabulary input failed: INVALID_LANGUAGE",
      );
      expect(String(error)).not.toContain(privateText);
    }
  });
});
