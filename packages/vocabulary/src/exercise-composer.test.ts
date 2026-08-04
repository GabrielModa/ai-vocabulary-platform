import { describe, expect, it } from "vitest";
import type { LearningCandidate } from "./candidate-pipeline.js";
import type { DistractorCandidateEvidence } from "./distractor-selection.js";
import { composeVerifiedExercise } from "./exercise-composer.js";
import type { ExampleContent } from "./providers.js";

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
        retrievedAt: "2026-08-04T01:30:00.000Z",
        generated: false,
        validationStatus: "verified",
      },
      confirmedBy: "unique-provider-match",
    },
    availableSenses: [],
    selectionReasons: ["fixture"],
  };
}

function example(
  sentence: string,
  id = "oewn-sample-verb:example:1",
  senseId = "oewn-sample-verb",
): ExampleContent {
  return {
    id,
    senseId,
    sentence,
    provenance: {
      provider: "open-english-wordnet",
      sourceVersion: "2025",
      sourceId: id,
      sourceUrl: "https://en-word.net/downloads/english-wordnet-2025-json.zip",
      license: "CC-BY-4.0",
      attribution: "Open English WordNet contributors",
      retrievedAt: "2026-08-04T01:30:00.000Z",
      generated: false,
      validationStatus: "verified",
    },
  };
}

const answer: DistractorCandidateEvidence = {
  candidate: candidate("sample", "verb"),
  frequencyPercentile: 0.6,
};

const pool: readonly DistractorCandidateEvidence[] = [
  { candidate: candidate("taste", "verb"), frequencyPercentile: 0.58 },
  { candidate: candidate("serve", "verb"), frequencyPercentile: 0.7 },
  { candidate: candidate("cook", "verb"), frequencyPercentile: 0.4 },
  { candidate: candidate("dish", "noun"), frequencyPercentile: 0.6 },
];

describe("verified exercise composer", () => {
  it("composes one verified exercise from domain components", () => {
    expect(
      composeVerifiedExercise({
        answer,
        examples: [example("Sample the regional dishes.")],
        distractorPool: pool,
      }),
    ).toEqual({
      ok: true,
      exerciseId:
        "exercise:candidate%3Asample%3Averb:oewn-sample-verb:oewn-sample-verb%3Aexample%3A1:cloze:v1",
      exerciseKind: "cloze",
      candidateId: "candidate:sample:verb",
      senseId: "oewn-sample-verb",
      exampleId: "oewn-sample-verb:example:1",
      sourceSentence: "Sample the regional dishes.",
      gapSentence: "___ the regional dishes.",
      answer: "sample",
      options: ["sample", "taste", "serve", "cook"],
      distractorCandidateIds: [
        "candidate:taste:verb",
        "candidate:serve:verb",
        "candidate:cook:verb",
      ],
      provenance: {
        exampleProvider: "open-english-wordnet",
        exampleSourceRecordId: "oewn-sample-verb:example:1",
        lexicalProvider: "open-english-wordnet",
        lexicalSourceRecordId: "oewn-sample-verb",
      },
      compositionStrategy: "verified-example-deterministic-distractors-sense-bound-cloze",
    });
  });

  it("skips an invalid example and uses the next verified example", () => {
    const result = composeVerifiedExercise({
      answer,
      examples: [
        example("Sampling regional dishes is useful.", "example:invalid"),
        example("You can sample regional dishes.", "example:valid"),
      ],
      distractorPool: pool,
    });

    expect(result).toMatchObject({
      ok: true,
      exampleId: "example:valid",
      gapSentence: "You can ___ regional dishes.",
    });
  });

  it("fails before composition when the answer has no selected sense", () => {
    const ambiguous: LearningCandidate = {
      candidateId: "candidate:sample:verb",
      displayForm: "sample",
      normalizedLemma: "sample",
      proposedPartOfSpeech: "verb",
      lexicalStatus: "ambiguous",
      availableSenses: [],
      selectionReasons: ["fixture"],
    };

    expect(
      composeVerifiedExercise({
        answer: { candidate: ambiguous },
        examples: [example("Sample the regional dishes.")],
        distractorPool: pool,
      }),
    ).toEqual({
      ok: false,
      code: "missing-selected-sense",
      message: "A confirmed lexical sense is required before composing an exercise",
      attemptedExampleCount: 0,
      causes: [],
    });
  });

  it("ignores examples from another lexical sense", () => {
    expect(
      composeVerifiedExercise({
        answer,
        examples: [
          example("Sample the regional dishes.", "oewn-other-verb:example:1", "oewn-other-verb"),
        ],
        distractorPool: pool,
      }),
    ).toMatchObject({
      ok: false,
      code: "missing-verified-example",
      attemptedExampleCount: 0,
    });
  });

  it("propagates a typed distractor-selection failure", () => {
    expect(
      composeVerifiedExercise({
        answer,
        examples: [example("Sample the regional dishes.")],
        distractorPool: [
          { candidate: candidate("taste", "verb") },
          { candidate: candidate("dish", "noun") },
        ],
      }),
    ).toEqual({
      ok: false,
      code: "insufficient-compatible-distractors",
      message: "Expected 3 compatible distractors",
      attemptedExampleCount: 0,
      causes: [
        {
          stage: "distractor-selection",
          code: "insufficient-compatible-candidates",
        },
      ],
    });
  });

  it("reports every rejected verified example", () => {
    expect(
      composeVerifiedExercise({
        answer,
        examples: [
          example("Sampling is useful.", "example:not-found"),
          example("Sample one, then sample another.", "example:multiple"),
        ],
        distractorPool: pool,
      }),
    ).toEqual({
      ok: false,
      code: "no-valid-example",
      message: "Verified examples were found, but none could produce a valid cloze",
      attemptedExampleCount: 2,
      causes: [
        {
          stage: "cloze-construction",
          exampleId: "example:not-found",
          code: "answer-not-found",
        },
        {
          stage: "cloze-construction",
          exampleId: "example:multiple",
          code: "answer-occurs-multiple-times",
        },
      ],
    });
  });

  it("produces the same exercise ID and order for identical inputs", () => {
    const input = {
      answer,
      examples: [example("Sample the regional dishes.")],
      distractorPool: pool,
    } as const;

    const first = composeVerifiedExercise(input);
    const second = composeVerifiedExercise(input);

    expect(second).toEqual(first);
  });

  it("does not mutate examples or the distractor pool", () => {
    const examples = [example("Sample the regional dishes.")] as const;
    const originalPoolOrder = pool.map((entry) => entry.candidate.candidateId);

    composeVerifiedExercise({
      answer,
      examples,
      distractorPool: pool,
    });

    expect(examples[0].sentence).toBe("Sample the regional dishes.");
    expect(pool.map((entry) => entry.candidate.candidateId)).toEqual(originalPoolOrder);
  });
});
