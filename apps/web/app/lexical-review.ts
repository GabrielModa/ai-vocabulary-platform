import { definitionRecallChallenge, type ExerciseKind } from "./sense-bound-exercise";

export interface ContentProvenance {
  readonly provider: string;
  readonly sourceVersion?: string;
  readonly sourceId?: string;
  readonly sourceUrl?: string;
  readonly license?: string;
  readonly attribution?: string;
  readonly retrievedAt: string;
  readonly generated: boolean;
  readonly adaptedFrom?: string;
  readonly validationStatus: "pending" | "provisional" | "verified" | "rejected";
}

export interface LexicalSense {
  readonly word: string;
  readonly normalizedWord: string;
  readonly senseId: string;
  readonly partOfSpeech: string;
  readonly definition?: string;
  readonly cefr?: string;
  readonly provenance: ContentProvenance;
}

export interface PublishedReviewExercise {
  readonly exerciseId: string;
  readonly exerciseKind: "cloze";
  readonly candidateId: string;
  readonly senseId: string;
  readonly exampleId: string;
  readonly sourceSentence: string;
  readonly gapSentence: string;
  readonly answer: string;
  readonly options: readonly string[];
  readonly provenance: {
    readonly exampleProvider: string;
    readonly exampleSourceRecordId: string;
    readonly lexicalProvider: string;
    readonly lexicalSourceRecordId: string;
  };
}

export type ReviewExercisePipelineOutcome =
  | {
      readonly outcome: "publish";
      readonly pipeline: "verified-exercise-pipeline-v1";
      readonly semanticUniqueness: "not-proven";
      readonly exercise: PublishedReviewExercise;
    }
  | {
      readonly outcome: "request-ai-fallback";
      readonly pipeline: "verified-exercise-pipeline-v1";
      readonly semanticUniqueness: "not-proven";
      readonly operation: "rewrite-context-only";
      readonly requestId: string;
      readonly triggeringReasons: readonly string[];
    }
  | {
      readonly outcome: "reject";
      readonly pipeline: "verified-exercise-pipeline-v1";
      readonly semanticUniqueness: "not-proven";
      readonly stage: "composition" | "structural-policy";
      readonly compositionCode?: string;
      readonly structuralReasons: readonly string[];
    };

export interface ReviewCandidate {
  readonly term: string;
  readonly meaning: string;
  readonly type: string;
  readonly example: string;
  readonly challenge: string;
  readonly contexts?: readonly string[];
  readonly lexicalValidationStatus?: "verified" | "provisional" | "unavailable";
  readonly senseId?: string;
  readonly lexicalProvenance?: ContentProvenance;
  readonly lexicalSenses?: readonly LexicalSense[];
  readonly exerciseKind?: ExerciseKind;
  readonly exercisePipelineOutcome?: ReviewExercisePipelineOutcome;
}

export function compatibleLexicalSenses(candidate: ReviewCandidate): readonly LexicalSense[] {
  return (candidate.lexicalSenses ?? []).filter(
    (sense) => sense.partOfSpeech === candidate.type && Boolean(sense.definition),
  );
}

export function requiresSenseConfirmation(candidate: ReviewCandidate): boolean {
  return (
    candidate.lexicalValidationStatus === "provisional" &&
    compatibleLexicalSenses(candidate).length > 1
  );
}

export function resolveCandidateSense(
  candidate: ReviewCandidate,
  senseId: string,
): ReviewCandidate {
  const sense = compatibleLexicalSenses(candidate).find((item) => item.senseId === senseId);
  if (!sense?.definition) throw new Error("Selected sense is not compatible");
  return {
    ...candidate,
    meaning: sense.definition,
    challenge: definitionRecallChallenge(sense.definition),
    exerciseKind: "definition-choice",
    lexicalValidationStatus: "verified",
    senseId: sense.senseId,
    lexicalProvenance: sense.provenance,
  };
}

function normalizedTerm(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

export function buildAnswerOptions(
  current: ReviewCandidate,
  candidates: readonly ReviewCandidate[],
): readonly string[] {
  const ordered = [
    current,
    ...candidates.filter(
      (candidate) => candidate.term !== current.term && candidate.type === current.type,
    ),
    ...candidates.filter(
      (candidate) => candidate.term !== current.term && candidate.type !== current.type,
    ),
  ];
  const seen = new Set<string>();
  return ordered
    .filter(({ term }) => {
      const normalized = normalizedTerm(term);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .slice(0, 4)
    .map(({ term }) => term);
}

export function countUnresolvedSelectedCandidates(
  candidates: readonly ReviewCandidate[],
  selected: ReadonlySet<string>,
): number {
  return candidates.filter(
    (candidate) => selected.has(candidate.term) && requiresSenseConfirmation(candidate),
  ).length;
}

export function publishedExercise(candidate: ReviewCandidate): PublishedReviewExercise | undefined {
  return candidate.exercisePipelineOutcome?.outcome === "publish"
    ? candidate.exercisePipelineOutcome.exercise
    : undefined;
}

export function candidateSentenceWithGap(candidate: ReviewCandidate): string {
  const published = publishedExercise(candidate);
  if (published) return published.gapSentence;
  if (candidate.challenge.includes("___")) return candidate.challenge;
  const escapedTerm = candidate.term.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const termPattern = new RegExp(`\\b${escapedTerm}\\b`, "iu");
  return termPattern.test(candidate.example)
    ? candidate.example.replace(termPattern, "___")
    : `${candidate.challenge} ___`;
}

export function candidateAnswerOptions(
  current: ReviewCandidate,
  candidates: readonly ReviewCandidate[],
): readonly string[] {
  return publishedExercise(current)?.options ?? buildAnswerOptions(current, candidates);
}

export function candidateCorrectAnswer(candidate: ReviewCandidate): string {
  return publishedExercise(candidate)?.answer ?? candidate.term;
}
