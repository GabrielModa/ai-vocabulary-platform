import { describe, expect, it } from "vitest";
import type { LearningCandidate } from "./candidate-pipeline.js";
import type { ExampleContent } from "./providers.js";
import { buildSenseBoundCloze } from "./sense-bound-cloze.js";

const candidate: LearningCandidate = {
  candidateId: "candidate:sample:verb",
  displayForm: "sample",
  normalizedLemma: "sample",
  proposedPartOfSpeech: "verb",
  lexicalStatus: "verified",
  selectedSense: {
    senseId: "oewn-01197832-v",
    definition: "take a sample of",
    partOfSpeech: "verb",
    provenance: {
      provider: "open-english-wordnet",
      sourceVersion: "2025",
      sourceId: "oewn-01197832-v",
      sourceUrl: "https://en-word.net/downloads/english-wordnet-2025-json.zip",
      license: "CC-BY-4.0",
      attribution: "Open English WordNet contributors",
      retrievedAt: "2026-08-04T00:00:00.000Z",
      generated: false,
      validationStatus: "verified",
    },
    confirmedBy: "unique-provider-match",
  },
  availableSenses: [],
  selectionReasons: ["fixture"],
};

const example: ExampleContent = {
  id: "oewn-01197832-v:example:1",
  senseId: "oewn-01197832-v",
  sentence: "Sample the regional dishes.",
  provenance: {
    provider: "open-english-wordnet",
    sourceVersion: "2025",
    sourceId: "oewn-01197832-v:example:1",
    sourceUrl: "https://en-word.net/downloads/english-wordnet-2025-json.zip",
    license: "CC-BY-4.0",
    attribution: "Open English WordNet contributors",
    retrievedAt: "2026-08-04T00:00:00.000Z",
    generated: false,
    validationStatus: "verified",
  },
};

describe("sense-bound cloze builder", () => {
  it("builds one deterministic gap from a verified example", () => {
    expect(
      buildSenseBoundCloze({
        candidate,
        example,
        distractors: ["taste", "cook", "serve"],
      }),
    ).toEqual({
      ok: true,
      candidateId: "candidate:sample:verb",
      senseId: "oewn-01197832-v",
      exampleId: "oewn-01197832-v:example:1",
      sourceSentence: "Sample the regional dishes.",
      gapSentence: "___ the regional dishes.",
      answer: "sample",
      options: ["sample", "taste", "cook", "serve"],
      source: {
        kind: "provider",
        provider: "open-english-wordnet",
        sourceRecordId: "oewn-01197832-v:example:1",
      },
    });
  });

  it("matches the answer case-insensitively while preserving the sentence", () => {
    const result = buildSenseBoundCloze({
      candidate,
      example: {
        ...example,
        sentence: "You should SAMPLE the regional dishes.",
      },
      distractors: ["taste", "cook", "serve"],
    });

    expect(result).toMatchObject({
      ok: true,
      gapSentence: "You should ___ the regional dishes.",
    });
  });

  it("rejects an example from another lexical sense", () => {
    expect(
      buildSenseBoundCloze({
        candidate,
        example: { ...example, senseId: "oewn-other-v" },
        distractors: ["taste", "cook", "serve"],
      }),
    ).toMatchObject({ ok: false, code: "example-sense-mismatch" });
  });

  it("rejects an example without the exact answer token", () => {
    expect(
      buildSenseBoundCloze({
        candidate,
        example: {
          ...example,
          sentence: "Sampling regional dishes is useful.",
        },
        distractors: ["taste", "cook", "serve"],
      }),
    ).toMatchObject({ ok: false, code: "answer-not-found" });
  });

  it("rejects examples containing the answer more than once", () => {
    expect(
      buildSenseBoundCloze({
        candidate,
        example: {
          ...example,
          sentence: "Sample one dish, then sample another.",
        },
        distractors: ["taste", "cook", "serve"],
      }),
    ).toMatchObject({
      ok: false,
      code: "answer-occurs-multiple-times",
    });
  });

  it("requires exactly three unique distractors", () => {
    expect(
      buildSenseBoundCloze({
        candidate,
        example,
        distractors: ["taste", "cook"],
      }),
    ).toMatchObject({ ok: false, code: "invalid-distractor-count" });

    expect(
      buildSenseBoundCloze({
        candidate,
        example,
        distractors: ["taste", "Sample", "serve"],
      }),
    ).toMatchObject({ ok: false, code: "duplicate-option" });
  });

  it("rejects verified examples without an auditable source record ID", () => {
    const provenanceWithoutSourceId = { ...example.provenance };
    delete provenanceWithoutSourceId.sourceId;

    expect(
      buildSenseBoundCloze({
        candidate,
        example: {
          ...example,
          provenance: provenanceWithoutSourceId,
        },
        distractors: ["taste", "cook", "serve"],
      }),
    ).toMatchObject({
      ok: false,
      code: "missing-source-record-id",
    });
  });

  it("does not build an exercise before sense confirmation", () => {
    const ambiguous: LearningCandidate = {
      candidateId: candidate.candidateId,
      displayForm: candidate.displayForm,
      normalizedLemma: candidate.normalizedLemma,
      proposedPartOfSpeech: "verb",
      lexicalStatus: "ambiguous",
      availableSenses: [],
      selectionReasons: ["fixture"],
    };

    expect(
      buildSenseBoundCloze({
        candidate: ambiguous,
        example,
        distractors: ["taste", "cook", "serve"],
      }),
    ).toMatchObject({ ok: false, code: "missing-selected-sense" });
  });
});
