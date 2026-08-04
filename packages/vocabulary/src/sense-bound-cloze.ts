import type { LearningCandidate } from "./candidate-pipeline.js";
import type { ExampleContent } from "./providers.js";

export type ClozeBuildFailureCode =
  | "missing-selected-sense"
  | "example-sense-mismatch"
  | "answer-not-found"
  | "answer-occurs-multiple-times"
  | "invalid-distractor-count"
  | "duplicate-option"
  | "missing-source-record-id";

export interface ClozeBuildFailure {
  readonly ok: false;
  readonly code: ClozeBuildFailureCode;
  readonly message: string;
}

export interface SenseBoundCloze {
  readonly ok: true;
  readonly candidateId: string;
  readonly senseId: string;
  readonly exampleId: string;
  readonly sourceSentence: string;
  readonly gapSentence: string;
  readonly answer: string;
  readonly options: readonly string[];
  readonly source: {
    readonly kind: "provider";
    readonly provider: string;
    readonly sourceRecordId: string;
  };
}

export type SenseBoundClozeResult = SenseBoundCloze | ClozeBuildFailure;

export interface BuildSenseBoundClozeInput {
  readonly candidate: LearningCandidate;
  readonly example: ExampleContent;
  readonly distractors: readonly string[];
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function answerPattern(answer: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegExp(answer)}(?![\\p{L}\\p{N}_])`, "giu");
}

function failure(code: ClozeBuildFailureCode, message: string): ClozeBuildFailure {
  return Object.freeze({ ok: false, code, message });
}

export function buildSenseBoundCloze(input: BuildSenseBoundClozeInput): SenseBoundClozeResult {
  const selectedSense = input.candidate.selectedSense;
  if (!selectedSense) {
    return failure(
      "missing-selected-sense",
      "A confirmed lexical sense is required before building a cloze exercise",
    );
  }

  if (input.example.senseId !== selectedSense.senseId) {
    return failure(
      "example-sense-mismatch",
      "The example must belong to the candidate's confirmed lexical sense",
    );
  }

  if (input.distractors.length !== 3) {
    return failure("invalid-distractor-count", "Exactly three distractors are required");
  }

  const answer = input.candidate.normalizedLemma.trim();
  const matches = [...input.example.sentence.matchAll(answerPattern(answer))];

  if (matches.length === 0) {
    return failure("answer-not-found", "The verified example does not contain the answer");
  }

  if (matches.length > 1) {
    return failure(
      "answer-occurs-multiple-times",
      "The verified example must contain the answer exactly once",
    );
  }

  const options = [answer, ...input.distractors.map((value) => value.trim())];
  const normalizedOptions = options.map(normalize);

  if (
    normalizedOptions.some((option) => option.length === 0) ||
    new Set(normalizedOptions).size !== options.length
  ) {
    return failure("duplicate-option", "The answer and distractors must be non-empty and unique");
  }

  const match = matches.at(0);
  if (match?.index === undefined) {
    return failure("answer-not-found", "The verified example does not contain the answer");
  }

  const sourceRecordId = input.example.provenance.sourceId;
  if (!sourceRecordId) {
    return failure(
      "missing-source-record-id",
      "The verified example is missing its source record ID",
    );
  }

  const gapSentence = `${input.example.sentence.slice(0, match.index)}___${input.example.sentence.slice(
    match.index + match[0].length,
  )}`;

  return Object.freeze({
    ok: true,
    candidateId: input.candidate.candidateId,
    senseId: selectedSense.senseId,
    exampleId: input.example.id,
    sourceSentence: input.example.sentence,
    gapSentence,
    answer,
    options: Object.freeze(options),
    source: Object.freeze({
      kind: "provider",
      provider: input.example.provenance.provider,
      sourceRecordId,
    }),
  });
}
