import { describe, expect, it } from "vitest";
import type {
  ExampleContent,
  FrequencyContent,
  LearningCandidate,
} from "@vocabulary/domain-vocabulary";
import { runCandidateExercisePipelines } from "./pipeline-adapter";

function candidate(lemma: string, partOfSpeech: string, selected = true): LearningCandidate {
  const senseId = `oewn-${lemma}-${partOfSpeech}`;
  return {
    candidateId: `candidate:${lemma}:${partOfSpeech}`,
    displayForm: lemma,
    normalizedLemma: lemma,
    proposedPartOfSpeech: partOfSpeech,
    lexicalStatus: selected ? "verified" : "ambiguous",
    ...(selected
      ? {
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
              retrievedAt: "2026-08-04T12:00:00.000Z",
              generated: false,
              validationStatus: "verified",
            },
            confirmedBy: "unique-provider-match",
          },
        }
      : {}),
    availableSenses: [],
    selectionReasons: ["fixture"],
  };
}

function frequency(percentile: number): FrequencyContent {
  return {
    word: "fixture",
    normalizedWord: "fixture",
    count: Math.round(percentile * 1_000),
    corpusSize: 1_000_000,
    frequencyPerMillion: percentile * 100,
    percentile,
    provenance: {
      provider: "subtlex-us",
      sourceVersion: "fixture",
      sourceId: "fixture",
      license: "research",
      attribution: "fixture",
      retrievedAt: "2026-08-04T12:00:00.000Z",
      generated: false,
      validationStatus: "verified",
    },
  };
}

function exampleFor(candidateValue: LearningCandidate, sentence: string): ExampleContent {
  const senseId = candidateValue.selectedSense?.senseId ?? "missing";
  const id = `${senseId}:example:1`;
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
      retrievedAt: "2026-08-04T12:00:00.000Z",
      generated: false,
      validationStatus: "verified",
    },
  };
}

describe("API exercise pipeline adapter", () => {
  it("returns publish outcomes for verified candidates", () => {
    const sample = candidate("sample", "verb");
    const taste = candidate("taste", "verb");
    const serve = candidate("serve", "verb");
    const cook = candidate("cook", "verb");

    const results = runCandidateExercisePipelines([
      {
        candidate: sample,
        frequency: frequency(0.6),
        examples: [exampleFor(sample, "Students can sample regional dishes during the festival.")],
      },
      { candidate: taste, frequency: frequency(0.58), examples: [] },
      { candidate: serve, frequency: frequency(0.7), examples: [] },
      { candidate: cook, frequency: frequency(0.4), examples: [] },
    ]);

    expect(results[0]).toMatchObject({
      candidateId: "candidate:sample:verb",
      outcome: {
        outcome: "publish",
        exercise: {
          answer: "sample",
          options: ["sample", "taste", "serve", "cook"],
        },
      },
    });
  });

  it("preserves candidate order among verified candidates", () => {
    const sample = candidate("sample", "verb");
    const taste = candidate("taste", "verb");
    const serve = candidate("serve", "verb");
    const cook = candidate("cook", "verb");

    const results = runCandidateExercisePipelines([
      { candidate: serve, examples: [] },
      { candidate: sample, examples: [] },
      { candidate: taste, examples: [] },
      { candidate: cook, examples: [] },
    ]);

    expect(results.map((result) => result.candidateId)).toEqual([
      "candidate:serve:verb",
      "candidate:sample:verb",
      "candidate:taste:verb",
      "candidate:cook:verb",
    ]);
  });

  it("does not run the exercise pipeline for provisional candidates", () => {
    const provisional = candidate("sample", "verb", false);
    const results = runCandidateExercisePipelines([{ candidate: provisional, examples: [] }]);

    expect(results).toEqual([]);
  });

  it("isolates rejection to the affected candidate", () => {
    const sample = candidate("sample", "verb");
    const taste = candidate("taste", "verb");
    const serve = candidate("serve", "verb");
    const cook = candidate("cook", "verb");

    const results = runCandidateExercisePipelines([
      {
        candidate: sample,
        examples: [exampleFor(sample, "Students can sample regional dishes during the festival.")],
      },
      { candidate: taste, examples: [] },
      { candidate: serve, examples: [] },
      { candidate: cook, examples: [] },
    ]);

    expect(results).toHaveLength(4);
    expect(results[0]?.outcome.outcome).toBe("publish");
    expect(results.slice(1).map((result) => result.outcome.outcome)).toEqual([
      "reject",
      "reject",
      "reject",
    ]);
  });

  it("is deterministic and does not mutate inputs", () => {
    const sample = candidate("sample", "verb");
    const taste = candidate("taste", "verb");
    const serve = candidate("serve", "verb");
    const cook = candidate("cook", "verb");
    const inputs = [
      {
        candidate: sample,
        examples: [exampleFor(sample, "Please sample now.")],
      },
      { candidate: taste, examples: [] },
      { candidate: serve, examples: [] },
      { candidate: cook, examples: [] },
    ] as const;
    const sentenceBefore = inputs[0].examples[0].sentence;

    const first = runCandidateExercisePipelines(inputs);
    const second = runCandidateExercisePipelines(inputs);

    expect(second).toEqual(first);
    expect(inputs[0].examples[0].sentence).toBe(sentenceBefore);
  });
});
