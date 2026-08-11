import type { LearningCandidate } from "./candidate-pipeline.js";
import type { VerifiedExercise } from "./exercise-composer.js";

export type SemanticUniquenessStatus = "not-proven" | "evidence-screened" | "failed-screening";

export type SemanticUniquenessIssueReason =
  | "missing-selected-sense"
  | "definition-cross-reference"
  | "definition-overlap"
  | "distractor-present-in-context";

export interface SemanticUniquenessIssue {
  readonly reason: SemanticUniquenessIssueReason;
  readonly distractorLemma: string;
}

export interface SemanticUniquenessScreenResult {
  readonly status: "evidence-screened" | "failed-screening";
  readonly strategy: "verified-definition-overlap-v1";
  readonly issues: readonly SemanticUniquenessIssue[];
}

const STOP_WORDS = new Set([
  "and",
  "are",
  "be",
  "for",
  "from",
  "into",
  "of",
  "one",
  "or",
  "someone",
  "something",
  "that",
  "the",
  "to",
  "which",
  "with",
]);

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

function tokens(value: string): ReadonlySet<string> {
  return new Set(
    normalize(value)
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((token) => token.length > 2 && !STOP_WORDS.has(token)) ?? [],
  );
}

function overlapCoefficient(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  const denominator = Math.min(left.size, right.size);
  if (denominator === 0) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / denominator;
}

function contextContainsLemma(context: string, lemma: string): boolean {
  const contextTokens = tokens(context);
  const lemmaTokens = [...tokens(lemma)];
  return lemmaTokens.length > 0 && lemmaTokens.every((token) => contextTokens.has(token));
}

export function screenExerciseSemanticUniqueness(input: {
  readonly exercise: VerifiedExercise;
  readonly answer: LearningCandidate;
  readonly distractors: readonly LearningCandidate[];
}): SemanticUniquenessScreenResult {
  const answerSense = input.answer.selectedSense;
  const answerLemma = normalize(input.answer.normalizedLemma);
  const answerDefinitionTokens = tokens(answerSense?.definition ?? "");
  const issues: SemanticUniquenessIssue[] = [];

  for (const distractor of input.distractors) {
    const distractorLemma = normalize(distractor.normalizedLemma);
    const distractorSense = distractor.selectedSense;
    if (!answerSense || !distractorSense) {
      issues.push({ reason: "missing-selected-sense", distractorLemma });
      continue;
    }

    if (contextContainsLemma(input.exercise.gapSentence, distractorLemma)) {
      issues.push({ reason: "distractor-present-in-context", distractorLemma });
      continue;
    }

    const distractorDefinitionTokens = tokens(distractorSense.definition);
    if (
      distractorDefinitionTokens.has(answerLemma) ||
      answerDefinitionTokens.has(distractorLemma)
    ) {
      issues.push({ reason: "definition-cross-reference", distractorLemma });
      continue;
    }

    if (
      Math.min(answerDefinitionTokens.size, distractorDefinitionTokens.size) >= 2 &&
      overlapCoefficient(answerDefinitionTokens, distractorDefinitionTokens) >= 0.75
    ) {
      issues.push({ reason: "definition-overlap", distractorLemma });
    }
  }

  const sortedIssues = Object.freeze(
    [...issues].sort(
      (left, right) =>
        left.distractorLemma.localeCompare(right.distractorLemma, "en-US") ||
        left.reason.localeCompare(right.reason, "en-US"),
    ),
  );
  return Object.freeze({
    status: sortedIssues.length === 0 ? "evidence-screened" : "failed-screening",
    strategy: "verified-definition-overlap-v1",
    issues: sortedIssues,
  });
}
