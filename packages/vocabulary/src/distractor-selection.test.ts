import { describe, expect, it } from "vitest";
import type { LearningCandidate } from "./candidate-pipeline.js";
import { selectDeterministicDistractors } from "./distractor-selection.js";

function candidate(
  lemma: string,
  partOfSpeech: string,
  senseId = `oewn-${lemma}-${partOfSpeech}`,
): LearningCandidate {
  return {
    candidateId: `candidate:${lemma}:${partOfSpeech}`,
    displayForm: lemma,
    normalizedLemma: lemma,
    proposedPartOfSpeech: partOfSpeech,
    lexicalStatus: "verified",
    selectedSense: {
      senseId,
      definition: `${lemma} definition`,
      partOfSpeech,
      provenance: {
        provider: "open-english-wordnet",
        sourceVersion: "2025",
        sourceId: senseId,
        sourceUrl: "https://en-word.net/downloads/english-wordnet-2025-json.zip",
        license: "CC-BY-4.0",
        attribution: "Open English WordNet contributors",
        retrievedAt: "2026-08-04T01:20:00.000Z",
        generated: false,
        validationStatus: "verified",
      },
      confirmedBy: "unique-provider-match",
    },
    availableSenses: [],
    selectionReasons: ["fixture"],
  };
}

describe("deterministic distractor selection", () => {
  it("selects three verified candidates with the same part of speech", () => {
    const result = selectDeterministicDistractors({
      answer: { candidate: candidate("sample", "verb"), frequencyPercentile: 0.6 },
      pool: [
        { candidate: candidate("taste", "verb"), frequencyPercentile: 0.58 },
        { candidate: candidate("serve", "verb"), frequencyPercentile: 0.7 },
        { candidate: candidate("cook", "verb"), frequencyPercentile: 0.4 },
        { candidate: candidate("dish", "noun"), frequencyPercentile: 0.6 },
      ],
    });

    expect(result).toEqual({
      ok: true,
      strategy: "verified-pos-frequency-distance",
      answerCandidateId: "candidate:sample:verb",
      answerSenseId: "oewn-sample-verb",
      distractors: [
        {
          candidateId: "candidate:taste:verb",
          lemma: "taste",
          senseId: "oewn-taste-verb",
          partOfSpeech: "verb",
          frequencyDistance: 0.020000000000000018,
        },
        {
          candidateId: "candidate:serve:verb",
          lemma: "serve",
          senseId: "oewn-serve-verb",
          partOfSpeech: "verb",
          frequencyDistance: 0.09999999999999998,
        },
        {
          candidateId: "candidate:cook:verb",
          lemma: "cook",
          senseId: "oewn-cook-verb",
          partOfSpeech: "verb",
          frequencyDistance: 0.19999999999999996,
        },
      ],
    });
  });

  it("excludes the answer, duplicate lemmas, and the same lexical sense", () => {
    const answer = candidate("sample", "verb");
    const result = selectDeterministicDistractors({
      answer: { candidate: answer },
      pool: [
        { candidate: answer },
        { candidate: candidate("SAMPLE", "verb", "oewn-other-sample-verb") },
        { candidate: candidate("taste", "verb", answer.selectedSense?.senseId) },
        { candidate: candidate("taste", "verb") },
        { candidate: candidate("serve", "verb") },
        { candidate: candidate("cook", "verb") },
      ],
    });

    expect(result).toMatchObject({
      ok: true,
      distractors: [{ lemma: "cook" }, { lemma: "serve" }, { lemma: "taste" }],
    });
  });

  it("uses candidate ID as a stable tie breaker", () => {
    const result = selectDeterministicDistractors({
      answer: { candidate: candidate("sample", "verb"), frequencyPercentile: 0.5 },
      pool: [
        { candidate: candidate("zeta", "verb"), frequencyPercentile: 0.5 },
        { candidate: candidate("alpha", "verb"), frequencyPercentile: 0.5 },
        { candidate: candidate("beta", "verb"), frequencyPercentile: 0.5 },
      ],
    });

    expect(result).toMatchObject({
      ok: true,
      distractors: [
        { candidateId: "candidate:alpha:verb" },
        { candidateId: "candidate:beta:verb" },
        { candidateId: "candidate:zeta:verb" },
      ],
    });
  });

  it("places candidates without frequency after frequency-supported candidates", () => {
    const result = selectDeterministicDistractors({
      answer: { candidate: candidate("sample", "verb"), frequencyPercentile: 0.5 },
      pool: [
        { candidate: candidate("unknown", "verb") },
        { candidate: candidate("taste", "verb"), frequencyPercentile: 0.9 },
        { candidate: candidate("serve", "verb"), frequencyPercentile: 0.6 },
      ],
    });

    expect(result).toMatchObject({
      ok: true,
      distractors: [{ lemma: "serve" }, { lemma: "taste" }, { lemma: "unknown" }],
    });
  });

  it("fails when the answer has no confirmed sense", () => {
    const answer: LearningCandidate = {
      candidateId: "candidate:sample:verb",
      displayForm: "sample",
      normalizedLemma: "sample",
      proposedPartOfSpeech: "verb",
      lexicalStatus: "ambiguous",
      availableSenses: [],
      selectionReasons: ["fixture"],
    };

    expect(
      selectDeterministicDistractors({
        answer: { candidate: answer },
        pool: [],
      }),
    ).toMatchObject({
      ok: false,
      code: "missing-selected-sense",
    });
  });

  it("fails explicitly when fewer than three candidates are compatible", () => {
    expect(
      selectDeterministicDistractors({
        answer: { candidate: candidate("sample", "verb") },
        pool: [{ candidate: candidate("taste", "verb") }, { candidate: candidate("dish", "noun") }],
      }),
    ).toEqual({
      ok: false,
      code: "insufficient-compatible-candidates",
      message: "Expected 3 compatible distractors",
      compatibleCandidateCount: 1,
    });
  });

  it("does not mutate the candidate pool", () => {
    const pool = [
      { candidate: candidate("zeta", "verb"), frequencyPercentile: 0.5 },
      { candidate: candidate("alpha", "verb"), frequencyPercentile: 0.5 },
      { candidate: candidate("beta", "verb"), frequencyPercentile: 0.5 },
    ] as const;

    selectDeterministicDistractors({
      answer: { candidate: candidate("sample", "verb"), frequencyPercentile: 0.5 },
      pool,
    });

    expect(pool.map((entry) => entry.candidate.normalizedLemma)).toEqual(["zeta", "alpha", "beta"]);
  });
});
