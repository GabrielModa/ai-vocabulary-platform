import type { LearningCandidate } from "./candidate-pipeline.js";

export type DistractorSelectionFailureCode =
  "missing-selected-sense" | "insufficient-compatible-candidates";

export interface DistractorSelectionFailure {
  readonly ok: false;
  readonly code: DistractorSelectionFailureCode;
  readonly message: string;
  readonly compatibleCandidateCount: number;
}

export interface DistractorCandidateEvidence {
  readonly candidate: LearningCandidate;
  readonly frequencyPercentile?: number;
}

export interface SelectedDistractor {
  readonly candidateId: string;
  readonly lemma: string;
  readonly senseId: string;
  readonly partOfSpeech: string;
  readonly frequencyDistance?: number;
}

export interface DistractorSelectionSuccess {
  readonly ok: true;
  readonly strategy: "verified-pos-frequency-distance";
  readonly answerCandidateId: string;
  readonly answerSenseId: string;
  readonly distractors: readonly SelectedDistractor[];
}

export type DistractorSelectionResult = DistractorSelectionSuccess | DistractorSelectionFailure;

export interface SelectDistractorsInput {
  readonly answer: DistractorCandidateEvidence;
  readonly pool: readonly DistractorCandidateEvidence[];
  readonly count?: number;
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").trim();
}

function boundedPercentile(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.min(1, Math.max(0, value));
}

function frequencyDistance(
  answerFrequency: number | undefined,
  candidateFrequency: number | undefined,
): number | undefined {
  const answer = boundedPercentile(answerFrequency);
  const candidate = boundedPercentile(candidateFrequency);
  if (answer === undefined || candidate === undefined) return undefined;
  return Math.abs(answer - candidate);
}

function failure(
  code: DistractorSelectionFailureCode,
  message: string,
  compatibleCandidateCount: number,
): DistractorSelectionFailure {
  return Object.freeze({
    ok: false,
    code,
    message,
    compatibleCandidateCount,
  });
}

export function selectDeterministicDistractors(
  input: SelectDistractorsInput,
): DistractorSelectionResult {
  const answerSense = input.answer.candidate.selectedSense;
  if (!answerSense) {
    return failure(
      "missing-selected-sense",
      "A confirmed answer sense is required before selecting distractors",
      0,
    );
  }

  const requestedCount = input.count ?? 3;
  if (!Number.isSafeInteger(requestedCount) || requestedCount < 1) {
    return failure(
      "insufficient-compatible-candidates",
      "Distractor count must be a positive safe integer",
      0,
    );
  }

  const answerLemma = normalize(input.answer.candidate.normalizedLemma);
  const seenLemmas = new Set<string>([answerLemma]);
  const compatible = input.pool.flatMap((entry) => {
    const sense = entry.candidate.selectedSense;
    if (!sense) return [];
    if (sense.partOfSpeech !== answerSense.partOfSpeech) return [];
    if (sense.senseId === answerSense.senseId) return [];

    const lemma = normalize(entry.candidate.normalizedLemma);
    if (!lemma || seenLemmas.has(lemma)) return [];
    seenLemmas.add(lemma);

    return [
      {
        candidateId: entry.candidate.candidateId,
        lemma,
        senseId: sense.senseId,
        partOfSpeech: sense.partOfSpeech,
        frequencyDistance: frequencyDistance(
          input.answer.frequencyPercentile,
          entry.frequencyPercentile,
        ),
      },
    ];
  });

  const sorted = [...compatible].sort((left, right) => {
    const leftDistance = left.frequencyDistance ?? Number.POSITIVE_INFINITY;
    const rightDistance = right.frequencyDistance ?? Number.POSITIVE_INFINITY;
    if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    return left.candidateId.localeCompare(right.candidateId, "en-US");
  });

  if (sorted.length < requestedCount) {
    return failure(
      "insufficient-compatible-candidates",
      `Expected ${String(requestedCount)} compatible distractors`,
      sorted.length,
    );
  }

  return Object.freeze({
    ok: true,
    strategy: "verified-pos-frequency-distance",
    answerCandidateId: input.answer.candidate.candidateId,
    answerSenseId: answerSense.senseId,
    distractors: Object.freeze(
      sorted.slice(0, requestedCount).map((candidate) =>
        Object.freeze({
          candidateId: candidate.candidateId,
          lemma: candidate.lemma,
          senseId: candidate.senseId,
          partOfSpeech: candidate.partOfSpeech,
          ...(candidate.frequencyDistance === undefined
            ? {}
            : { frequencyDistance: candidate.frequencyDistance }),
        }),
      ),
    ),
  });
}
