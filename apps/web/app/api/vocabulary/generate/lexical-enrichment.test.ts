import { describe, expect, it } from "vitest";
import type { LocalVocabularySet } from "@vocabulary/ai";
import {
  enrichVocabularySet,
  type ExampleLookup,
  type FrequencyLookup,
  type LexicalLookup,
  type PronunciationLookup,
} from "./lexical-enrichment.js";

const generated: LocalVocabularySet = {
  title: "Family vocabulary",
  candidates: [
    {
      term: "uncle",
      meaning: "a male relative",
      type: "noun",
      example: "My uncle visited us.",
      challenge: "My ___ visited us.",
    },
  ],
};

function lookup(results: readonly unknown[]): LexicalLookup {
  return { lookup: () => Promise.resolve(results) };
}

function lookupByWord(results: Readonly<Record<string, readonly unknown[]>>): LexicalLookup {
  return {
    lookup: ({ word }) => Promise.resolve(results[word] ?? []),
  };
}

function frequencyByWord(results: Readonly<Record<string, unknown>>): FrequencyLookup {
  return {
    lookup: ({ word }) => Promise.resolve(results[word]),
  };
}

function pronunciationByWord(
  results: Readonly<Record<string, readonly unknown[]>>,
): PronunciationLookup {
  return { lookup: ({ word }) => Promise.resolve(results[word] ?? []) };
}

function examplesBySense(results: Readonly<Record<string, readonly unknown[]>>): ExampleLookup {
  return { find: ({ senseId }) => Promise.resolve(results[senseId] ?? []) };
}

const provenance = {
  provider: "open-english-wordnet",
  sourceVersion: "2025",
  sourceUrl: "https://en-word.net/static/english-wordnet-2025-json.zip",
  license: "CC-BY-4.0",
  attribution: "Open English WordNet contributors",
  retrievedAt: "2026-08-03T00:00:00.000Z",
  generated: false,
  validationStatus: "verified",
} as const;

const familySense = {
  word: "uncle",
  normalizedWord: "uncle",
  senseId: "oewn-family-n",
  partOfSpeech: "noun",
  definition: "the brother of your father or mother; the husband of your aunt",
  provenance: {
    ...provenance,
    sourceId: "oewn-family-n",
  },
} as const;

const uncleFrequency = {
  word: "uncle",
  normalizedWord: "uncle",
  count: 8_020,
  corpusSize: 51_000_000,
  frequencyPerMillion: 157.254902,
  percentile: 0.72,
  provenance: {
    provider: "subtlex-us",
    sourceVersion: "2.0",
    sourceId: "uncle",
    sourceUrl: "https://github.com/words/subtlex-word-frequencies",
    license: "ISC",
    attribution: "SUBTLEX-US authors and subtlex-word-frequencies contributors",
    retrievedAt: "2026-08-03T23:55:00.000Z",
    generated: false,
    validationStatus: "verified",
  },
} as const;

describe("server lexical enrichment", () => {
  it("uses a canonical candidate with one compatible verified sense", async () => {
    const enriched = await enrichVocabularySet(generated, lookup([familySense]));
    expect(enriched).toMatchObject({
      candidateStrategy: "suggest-verify-select",
      rankingStrategy: "deterministic-weighted-ranking",
      qualitySummary: {
        requestedCount: 1,
        acceptedCount: 1,
        usableCount: 1,
        deficitCount: 0,
        coveragePercentage: 100,
      },
    });
    expect(enriched.candidates[0]).toMatchObject({
      candidateId: "candidate:uncle:noun",
      normalizedLemma: "uncle",
      selectionReasons: ["suggested-by-local-ai", "matched-request-context"],
      meaning: familySense.definition,
      challenge: `Which word matches this meaning: "${familySense.definition}"? ___`,
      exerciseKind: "definition-choice",
      senseId: familySense.senseId,
      lexicalValidationStatus: "verified",
      rank: 1,
      rankingScore: 40,
      rankingContributions: [{ reason: "verified-sense", points: 40 }],
      qualityReport: {
        decision: "accept",
        exerciseReadiness: "ready",
        dimensions: { lexicalCoverage: 100 },
      },
    });
  });

  it("uses verified examples as the primary example and study contexts", async () => {
    const examples = [
      "My uncle called today.",
      "Her uncle lives nearby.",
      "I thanked my uncle.",
    ].map((sentence, index) => ({
      id: `${familySense.senseId}:example:${String(index + 1)}`,
      senseId: familySense.senseId,
      sentence,
      provenance: {
        ...provenance,
        sourceId: `${familySense.senseId}:example:${String(index + 1)}`,
      },
    }));

    const enriched = await enrichVocabularySet(
      generated,
      lookup([familySense]),
      undefined,
      examplesBySense({ [familySense.senseId]: examples }),
    );

    expect(enriched.candidates[0]).toMatchObject({
      example: examples[0]?.sentence,
      contexts: examples.map(({ sentence }) => sentence),
      verifiedExamples: examples,
    });
  });

  it("adds verified frequency evidence to ranking and response metadata", async () => {
    const enriched = await enrichVocabularySet(
      generated,
      lookup([familySense]),
      frequencyByWord({ uncle: uncleFrequency }),
    );

    expect(enriched.candidates[0]).toMatchObject({
      rankingScore: 47,
      frequencyPercentile: 0.72,
      frequencyPerMillion: 157.254902,
      frequencyProvenance: {
        provider: "subtlex-us",
        sourceId: "uncle",
        validationStatus: "verified",
      },
      rankingContributions: [
        { reason: "verified-sense", points: 40 },
        { reason: "frequency-supported", points: 7 },
      ],
    });
  });

  it("attaches only verified pronunciation evidence without inventing IPA", async () => {
    const pronunciation = {
      word: "uncle",
      dialect: "en-US",
      transcription: "AH1 NG K AH0 L",
      notation: "ARPABET",
      provenance: {
        provider: "cmu-pronouncing-dictionary",
        sourceVersion: "0.7b",
        sourceId: "uncle#1",
        sourceUrl: "https://github.com/cmusphinx/cmudict",
        license: "CMUdict license",
        attribution: "Carnegie Mellon University",
        retrievedAt: "2026-08-11T00:00:00.000Z",
        generated: false,
        validationStatus: "verified",
      },
    } as const;

    const enriched = await enrichVocabularySet(
      generated,
      lookup([familySense]),
      undefined,
      undefined,
      pronunciationByWord({ uncle: [pronunciation] }),
    );

    expect(enriched.candidates[0]).toMatchObject({
      verifiedPronunciations: [
        {
          transcription: "AH1 NG K AH0 L",
          notation: "ARPABET",
          provenance: { sourceId: "uncle#1", validationStatus: "verified" },
        },
      ],
    });
    expect(enriched.candidates[0]).not.toHaveProperty("ipa");
  });

  it("does not guess when multiple compatible senses exist", async () => {
    const enriched = await enrichVocabularySet(
      generated,
      lookup([familySense, { ...familySense, senseId: "oewn-helper-n" }]),
    );
    expect(enriched.candidates[0]).toMatchObject({
      meaning: generated.candidates[0]?.meaning,
      lexicalValidationStatus: "provisional",
      rankingContributions: [{ reason: "ambiguous-sense", points: 15 }],
    });
    expect(enriched.candidates[0]).not.toHaveProperty("senseId");
  });

  it("resolves an explicit topic-bound sense without another model call", async () => {
    const footballSense = {
      ...familySense,
      senseId: "oewn-football-penalty-n",
      word: "penalty",
      normalizedWord: "penalty",
      definition: "A free kick awarded in football after a serious foul.",
      provenance: { ...familySense.provenance, sourceId: "oewn-football-penalty-n" },
    };
    const punishmentSense = {
      ...footballSense,
      senseId: "oewn-punishment-penalty-n",
      definition: "A punishment imposed for breaking a law or rule.",
      provenance: { ...familySense.provenance, sourceId: "oewn-punishment-penalty-n" },
    };
    const vocabularySet: LocalVocabularySet = {
      title: "football vocabulary",
      candidates: [
        {
          term: "penalty",
          meaning: "Meaning pending lexical verification.",
          type: "noun",
          example: "A verified example is not available yet.",
          challenge: "Confirm the intended meaning before training.",
        },
      ],
    };

    const enriched = await enrichVocabularySet(
      vocabularySet,
      lookup([footballSense, punishmentSense]),
    );

    expect(enriched.candidates[0]).toMatchObject({
      lexicalValidationStatus: "verified",
      senseId: footballSense.senseId,
      meaning: footballSense.definition,
      lexicalProvenance: { provider: "open-english-wordnet", generated: false },
    });
  });

  it("marks missing facts as unavailable", async () => {
    const enriched = await enrichVocabularySet(generated, lookup([]));
    expect(enriched.candidates[0]).toMatchObject({
      lexicalValidationStatus: "unavailable",
      rankingScore: -30,
    });
  });

  it("fails soft when either local provider cannot be read", async () => {
    const enriched = await enrichVocabularySet(
      generated,
      {
        lookup: () => Promise.reject(new Error("invalid lexical index")),
      },
      {
        lookup: () => Promise.reject(new Error("invalid frequency index")),
      },
    );
    expect(enriched.candidates[0]).toMatchObject({
      meaning: generated.candidates[0]?.meaning,
      lexicalValidationStatus: "unavailable",
      rankingScore: -30,
    });
    expect(enriched.candidates[0]).not.toHaveProperty("frequencyPercentile");
  });

  it("deduplicates normalized AI suggestions and exposes rejections", async () => {
    const originalCandidate = generated.candidates[0];
    if (!originalCandidate) throw new Error("expected generated candidate fixture");
    const duplicated: LocalVocabularySet = {
      ...generated,
      candidates: [originalCandidate, { ...originalCandidate, term: " UNCLE " }],
    };
    const enriched = await enrichVocabularySet(duplicated, lookup([familySense]));
    expect(enriched.candidates).toHaveLength(1);
    expect(enriched.rejectedCandidates).toEqual([
      { term: " UNCLE ", normalizedLemma: "uncle", reason: "duplicate-term" },
    ]);
  });

  it("reorders AI suggestions using verified lexical evidence", async () => {
    const vocabularySet: LocalVocabularySet = {
      title: "Mixed vocabulary",
      candidates: [
        {
          term: "nonsenseword",
          meaning: "generated meaning",
          type: "noun",
          example: "Generated example.",
          challenge: "Generated ___.",
        },
        {
          term: "uncle",
          meaning: "a male relative",
          type: "noun",
          example: "My uncle visited us.",
          challenge: "My ___ visited us.",
        },
      ],
    };

    const enriched = await enrichVocabularySet(
      vocabularySet,
      lookupByWord({ uncle: [familySense] }),
    );

    expect(enriched.candidates.map((candidate) => candidate.term)).toEqual([
      "uncle",
      "nonsenseword",
    ]);
    expect(enriched.candidates.map((candidate) => candidate.rank)).toEqual([1, 2]);
    expect(enriched.candidates.map((candidate) => candidate.rankingScore)).toEqual([40, -30]);
  });

  it("uses frequency to break ties without changing lexical facts", async () => {
    const vocabularySet: LocalVocabularySet = {
      title: "Frequency-ranked vocabulary",
      candidates: [
        {
          term: "zeta",
          meaning: "generated zeta",
          type: "noun",
          example: "Zeta example.",
          challenge: "Zeta ___.",
        },
        {
          term: "alpha",
          meaning: "generated alpha",
          type: "noun",
          example: "Alpha example.",
          challenge: "Alpha ___.",
        },
      ],
    };

    const alphaSense = {
      ...familySense,
      word: "alpha",
      normalizedWord: "alpha",
      senseId: "oewn-alpha-n",
      provenance: { ...familySense.provenance, sourceId: "oewn-alpha-n" },
    };
    const zetaSense = {
      ...familySense,
      word: "zeta",
      normalizedWord: "zeta",
      senseId: "oewn-zeta-n",
      provenance: { ...familySense.provenance, sourceId: "oewn-zeta-n" },
    };

    const enriched = await enrichVocabularySet(
      vocabularySet,
      lookupByWord({ alpha: [alphaSense], zeta: [zetaSense] }),
      frequencyByWord({
        alpha: {
          ...uncleFrequency,
          word: "alpha",
          normalizedWord: "alpha",
          percentile: 0.9,
          provenance: { ...uncleFrequency.provenance, sourceId: "alpha" },
        },
        zeta: {
          ...uncleFrequency,
          word: "zeta",
          normalizedWord: "zeta",
          percentile: 0.1,
          provenance: { ...uncleFrequency.provenance, sourceId: "zeta" },
        },
      }),
    );

    expect(enriched.candidates.map((candidate) => candidate.term)).toEqual(["alpha", "zeta"]);
    expect(enriched.candidates.map((candidate) => candidate.rankingScore)).toEqual([49, 41]);
  });
});
