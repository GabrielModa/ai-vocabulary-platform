import { describe, expect, it } from "vitest";
import type { LearningCandidate } from "./candidate-pipeline.js";
import type { DistractorCandidateEvidence } from "./distractor-selection.js";
import { runVerifiedExercisePipeline } from "./exercise-pipeline.js";
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
        retrievedAt: "2026-08-04T11:45:00.000Z",
        generated: false,
        validationStatus: "verified",
      },
      confirmedBy: "unique-provider-match",
    },
    availableSenses: [],
    selectionReasons: ["fixture"],
  };
}

function example(sentence: string): ExampleContent {
  const senseId = "oewn-sample-verb";
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
      retrievedAt: "2026-08-04T11:45:00.000Z",
      generated: false,
      validationStatus: "verified",
    },
  };
}

const answer: DistractorCandidateEvidence = {
  candidate: candidate("sample", "verb"),
  frequencyPercentile: 0.6,
};

const distractorPool: readonly DistractorCandidateEvidence[] = [
  { candidate: candidate("taste", "verb"), frequencyPercentile: 0.58 },
  { candidate: candidate("serve", "verb"), frequencyPercentile: 0.7 },
  { candidate: candidate("cook", "verb"), frequencyPercentile: 0.4 },
];

describe("verified exercise pipeline", () => {
  it("publishes a composed exercise that passes readiness", () => {
    const result = runVerifiedExercisePipeline({
      answer,
      examples: [example("Students can sample regional dishes during the festival.")],
      distractorPool,
    });

    expect(result).toMatchObject({
      outcome: "publish",
      pipeline: "verified-exercise-pipeline-v1",
      exercise: {
        answer: "sample",
        gapSentence: "Students can ___ regional dishes during the festival.",
        options: ["sample", "taste", "serve", "cook"],
      },
      semanticUniqueness: "not-proven",
    });
  });

  it("requests AI fallback only for reparable context weakness", () => {
    const result = runVerifiedExercisePipeline({
      answer,
      examples: [example("Please sample now.")],
      distractorPool,
    });

    expect(result).toMatchObject({
      outcome: "request-ai-fallback",
      pipeline: "verified-exercise-pipeline-v1",
      request: {
        operation: "rewrite-context-only",
        answer: "sample",
        senseId: "oewn-sample-verb",
        triggeringReasons: ["context-too-short"],
      },
      readinessIssues: [{ reason: "context-too-short" }],
      semanticUniqueness: "not-proven",
    });
  });

  it("rejects when composition has no verified example", () => {
    const result = runVerifiedExercisePipeline({
      answer,
      examples: [],
      distractorPool,
    });

    expect(result).toMatchObject({
      outcome: "reject",
      stage: "composition",
      compositionFailure: {
        code: "missing-verified-example",
      },
      structuralReasons: [],
    });
  });

  it("rejects when composition lacks compatible distractors", () => {
    const result = runVerifiedExercisePipeline({
      answer,
      examples: [example("Students can sample regional dishes.")],
      distractorPool: [
        {
          candidate: candidate("dish", "noun"),
          frequencyPercentile: 0.6,
        },
      ],
    });

    expect(result).toMatchObject({
      outcome: "reject",
      stage: "composition",
      compositionFailure: {
        code: "insufficient-compatible-distractors",
      },
    });
  });

  it("rejects when no verified example can produce a cloze", () => {
    const result = runVerifiedExercisePipeline({
      answer,
      examples: [example("Sampling regional dishes is useful.")],
      distractorPool,
    });

    expect(result).toMatchObject({
      outcome: "reject",
      stage: "composition",
      compositionFailure: {
        code: "no-valid-example",
        causes: [
          {
            stage: "cloze-construction",
            code: "answer-not-found",
          },
        ],
      },
    });
  });

  it("is deterministic for identical input", () => {
    const input = {
      answer,
      examples: [example("Please sample now.")],
      distractorPool,
    } as const;

    const first = runVerifiedExercisePipeline(input);
    const second = runVerifiedExercisePipeline(input);

    expect(second).toEqual(first);
  });

  it("does not mutate examples or distractor candidates", () => {
    const examples = [example("Students can sample regional dishes during the festival.")] as const;
    const poolOrder = distractorPool.map((entry) => entry.candidate.candidateId);

    runVerifiedExercisePipeline({
      answer,
      examples,
      distractorPool,
    });

    expect(examples[0].sentence).toBe("Students can sample regional dishes during the festival.");
    expect(distractorPool.map((entry) => entry.candidate.candidateId)).toEqual(poolOrder);
  });
});
