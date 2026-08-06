import { describe, expect, it } from "vitest";
import type { ReviewCandidate } from "./lexical-review";
import {
  applySensePreference,
  readSensePreferences,
  writeSensePreference,
} from "./sense-preferences";

class MemoryStorage {
  private value: string | null = null;

  getItem(): string | null {
    return this.value;
  }

  setItem(_key: string, value: string): void {
    this.value = value;
  }
}

const candidate: ReviewCandidate = {
  candidateId: "candidate:bank:noun",
  term: "bank",
  meaning: "sloping land beside a river",
  type: "noun",
  example: "They sat on the river bank.",
  challenge: "Which word matches this meaning?",
  lexicalValidationStatus: "provisional",
  lexicalSenses: [
    {
      word: "bank",
      normalizedWord: "bank",
      senseId: "sense:river-bank",
      partOfSpeech: "noun",
      definition: "sloping land beside a river",
      provenance: {
        provider: "fixture",
        retrievedAt: "2026-08-06T00:00:00.000Z",
        generated: false,
        validationStatus: "verified",
      },
    },
    {
      word: "bank",
      normalizedWord: "bank",
      senseId: "sense:financial-bank",
      partOfSpeech: "noun",
      definition: "a financial institution",
      provenance: {
        provider: "fixture",
        retrievedAt: "2026-08-06T00:00:00.000Z",
        generated: false,
        validationStatus: "verified",
      },
    },
  ],
};

describe("sense preferences", () => {
  it("stores preferences under a normalized term", () => {
    const storage = new MemoryStorage();

    writeSensePreference(storage, " Bank ", "sense:financial-bank");

    expect(readSensePreferences(storage)).toEqual({
      bank: "sense:financial-bank",
    });
  });

  it("applies a trusted preferred sense to a future candidate", () => {
    expect(
      applySensePreference(candidate, {
        bank: "sense:financial-bank",
      }),
    ).toMatchObject({
      senseId: "sense:financial-bank",
      meaning: "a financial institution",
      lexicalValidationStatus: "verified",
    });
  });

  it("preserves the generated candidate when a stored sense no longer exists", () => {
    expect(
      applySensePreference(candidate, {
        bank: "sense:removed",
      }),
    ).toEqual(candidate);
  });
});
