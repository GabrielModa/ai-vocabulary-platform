import { describe, expect, it } from "vitest";
import {
  buildAnswerOptions,
  candidateAnswerOptions,
  candidateCorrectAnswer,
  candidateSentenceWithGap,
  compatibleLexicalSenses,
  countUnresolvedSelectedCandidates,
  resolveCandidateSense,
  type ReviewCandidate,
} from "./lexical-review";

const candidate: ReviewCandidate = {
  term: "pitch",
  meaning: "A generated provisional meaning.",
  type: "noun",
  example: "The players walked onto the pitch.",
  challenge: "The players walked onto the ___.",
  lexicalValidationStatus: "provisional",
  lexicalSenses: [
    {
      word: "pitch",
      normalizedWord: "pitch",
      senseId: "surface-n",
      partOfSpeech: "noun",
      definition: "A playing surface for sport.",
      provenance: {
        provider: "oewn",
        sourceId: "surface-n",
        license: "CC BY 4.0",
        attribution: "Open English WordNet",
        retrievedAt: "2026-08-03T00:00:00.000Z",
        generated: false,
        validationStatus: "verified",
      },
    },
    {
      word: "pitch",
      normalizedWord: "pitch",
      senseId: "throw-v",
      partOfSpeech: "verb",
      definition: "To throw an object.",
      provenance: {
        provider: "oewn",
        sourceId: "throw-v",
        license: "CC BY 4.0",
        attribution: "Open English WordNet",
        retrievedAt: "2026-08-03T00:00:00.000Z",
        generated: false,
        validationStatus: "verified",
      },
    },
    {
      word: "pitch",
      normalizedWord: "pitch",
      senseId: "sound-n",
      partOfSpeech: "noun",
      definition: "The perceived frequency of a sound.",
      provenance: {
        provider: "oewn",
        sourceId: "sound-n",
        license: "CC BY 4.0",
        attribution: "Open English WordNet",
        retrievedAt: "2026-08-03T00:00:00.000Z",
        generated: false,
        validationStatus: "verified",
      },
    },
  ],
};

describe("lexical review", () => {
  it("offers only senses compatible with the generated word class", () => {
    expect(compatibleLexicalSenses(candidate).map(({ senseId }) => senseId)).toEqual([
      "surface-n",
      "sound-n",
    ]);
  });

  it("resolves a candidate only with one of its compatible senses", () => {
    expect(resolveCandidateSense(candidate, "sound-n")).toMatchObject({
      meaning: "The perceived frequency of a sound.",
      lexicalValidationStatus: "verified",
      exerciseKind: "definition-choice",
      challenge: 'Which word matches this meaning: "The perceived frequency of a sound."? ___',
      senseId: "sound-n",
      lexicalProvenance: candidate.lexicalSenses?.[2]?.provenance,
    });
    expect(() => resolveCandidateSense(candidate, "throw-v")).toThrow(
      "Selected sense is not compatible",
    );
  });

  it("prioritizes unique distractors with the same word class", () => {
    expect(
      buildAnswerOptions(candidate, [
        candidate,
        { ...candidate, term: "field", type: "noun" },
        { ...candidate, term: "throw", type: "verb" },
        { ...candidate, term: "tone", type: "noun" },
        { ...candidate, term: "PITCH", type: "noun" },
      ]),
    ).toEqual(["pitch", "field", "tone", "throw"]);
  });

  it("counts unresolved ambiguity only among selected candidates", () => {
    const verified = { ...candidate, term: "goal", lexicalValidationStatus: "verified" as const };
    expect(
      countUnresolvedSelectedCandidates([candidate, verified], new Set(["pitch", "goal"])),
    ).toBe(1);
    expect(countUnresolvedSelectedCandidates([candidate, verified], new Set(["goal"]))).toBe(0);
  });
  it("uses a published exercise as the training source of truth", () => {
    const candidate: ReviewCandidate = {
      term: "sample",
      meaning: "try a small amount",
      type: "verb",
      example: "Legacy example.",
      challenge: "Legacy challenge",
      exercisePipelineOutcome: {
        outcome: "publish",
        pipeline: "verified-exercise-pipeline-v1",
        semanticUniqueness: "not-proven",
        exercise: {
          exerciseId: "exercise:sample",
          exerciseKind: "cloze",
          candidateId: "candidate:sample:verb",
          senseId: "sense:sample",
          exampleId: "example:sample",
          sourceSentence: "Students sample regional dishes.",
          gapSentence: "Students ___ regional dishes.",
          answer: "sample",
          options: ["sample", "taste", "serve", "cook"],
          provenance: {
            exampleProvider: "oewn",
            exampleSourceRecordId: "example:sample",
            lexicalProvider: "oewn",
            lexicalSourceRecordId: "sense:sample",
          },
        },
      },
    };

    expect(candidateSentenceWithGap(candidate)).toBe("Students ___ regional dishes.");
    expect(candidateAnswerOptions(candidate, [candidate])).toEqual([
      "sample",
      "taste",
      "serve",
      "cook",
    ]);
    expect(candidateCorrectAnswer(candidate)).toBe("sample");
  });

  it("does not treat rejection as a published exercise", () => {
    const candidate: ReviewCandidate = {
      term: "sample",
      meaning: "try a small amount",
      type: "verb",
      example: "Please sample the food.",
      challenge: "Try a small amount",
      exercisePipelineOutcome: {
        outcome: "reject",
        pipeline: "verified-exercise-pipeline-v1",
        semanticUniqueness: "not-proven",
        stage: "composition",
        compositionCode: "missing-verified-example",
        structuralReasons: [],
      },
    };

    expect(candidateSentenceWithGap(candidate)).toBe("Please ___ the food.");
    expect(candidateCorrectAnswer(candidate)).toBe("sample");
  });
});
