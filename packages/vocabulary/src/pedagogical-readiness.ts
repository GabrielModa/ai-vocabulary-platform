import type { ExerciseValidationIssue } from "./exercise-validator.js";
import { validateVerifiedExercise, type ExerciseValidationInput } from "./exercise-validator.js";

export type PedagogicalFallbackReason =
  | "structurally-not-ready"
  | "context-too-short"
  | "answer-dominates-context"
  | "option-visible-outside-gap";

export interface PedagogicalReadinessIssue {
  readonly reason: PedagogicalFallbackReason;
  readonly message: string;
  readonly evidence: Readonly<Record<string, string | number>>;
}

export interface PedagogicallyReadyResult {
  readonly ready: true;
  readonly status: "pedagogically-ready";
  readonly exercise: ExerciseValidationInput;
  readonly issues: readonly [];
  readonly policy: "deterministic-conservative-v1";
  readonly semanticUniqueness: "not-proven";
}

export interface NeedsFallbackResult {
  readonly ready: false;
  readonly status: "needs-fallback";
  readonly exercise: ExerciseValidationInput;
  readonly issues: readonly PedagogicalReadinessIssue[];
  readonly structuralIssues: readonly ExerciseValidationIssue[];
  readonly policy: "deterministic-conservative-v1";
  readonly semanticUniqueness: "not-proven";
}

export type PedagogicalReadinessResult = PedagogicallyReadyResult | NeedsFallbackResult;

const NO_ISSUES: readonly [] = Object.freeze([]);
const MINIMUM_CONTEXT_TOKENS = 3;
const MAXIMUM_ANSWER_CHARACTER_RATIO = 0.5;

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").trim();
}

function lexicalTokens(value: string): readonly string[] {
  return value.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
}

function lexicalCharacterCount(value: string): number {
  return lexicalTokens(value).join("").length;
}

function issue(
  reason: PedagogicalFallbackReason,
  message: string,
  evidence: Readonly<Record<string, string | number>>,
): PedagogicalReadinessIssue {
  return Object.freeze({
    reason,
    message,
    evidence: Object.freeze({ ...evidence }),
  });
}

function optionVisibleOutsideGap(context: string, option: string): boolean {
  const normalizedOption = normalize(option);
  if (!normalizedOption) return false;

  return lexicalTokens(context).map(normalize).includes(normalizedOption);
}

export function evaluatePedagogicalReadiness(
  exercise: ExerciseValidationInput,
): PedagogicalReadinessResult {
  const structural = validateVerifiedExercise(exercise);
  if (!structural.ready) {
    return Object.freeze({
      ready: false,
      status: "needs-fallback",
      exercise,
      issues: Object.freeze([
        issue(
          "structurally-not-ready",
          "Exercise must pass structural validation before pedagogical evaluation",
          { structuralIssueCount: structural.issues.length },
        ),
      ]),
      structuralIssues: structural.issues,
      policy: "deterministic-conservative-v1",
      semanticUniqueness: "not-proven",
    });
  }

  const issues: PedagogicalReadinessIssue[] = [];
  const contextWithoutGap = exercise.gapSentence.replace("___", " ");
  const contextTokenCount = lexicalTokens(contextWithoutGap).length;

  if (contextTokenCount < MINIMUM_CONTEXT_TOKENS) {
    issues.push(
      issue(
        "context-too-short",
        "The sentence does not provide enough visible context for a reliable exercise",
        {
          contextTokenCount,
          minimumContextTokens: MINIMUM_CONTEXT_TOKENS,
        },
      ),
    );
  }

  const answerCharacterCount = lexicalCharacterCount(exercise.answer);
  const sourceCharacterCount = lexicalCharacterCount(exercise.sourceSentence);
  const answerCharacterRatio =
    sourceCharacterCount === 0 ? 1 : answerCharacterCount / sourceCharacterCount;

  if (answerCharacterRatio > MAXIMUM_ANSWER_CHARACTER_RATIO) {
    issues.push(
      issue(
        "answer-dominates-context",
        "The answer occupies too much of the source sentence to provide useful context",
        {
          answerCharacterCount,
          sourceCharacterCount,
          answerCharacterRatio,
          maximumAnswerCharacterRatio: MAXIMUM_ANSWER_CHARACTER_RATIO,
        },
      ),
    );
  }

  for (const option of exercise.options) {
    if (optionVisibleOutsideGap(contextWithoutGap, option)) {
      issues.push(
        issue(
          "option-visible-outside-gap",
          "An answer option is already visible outside the exercise gap",
          { option },
        ),
      );
    }
  }

  if (issues.length > 0) {
    return Object.freeze({
      ready: false,
      status: "needs-fallback",
      exercise,
      issues: Object.freeze(issues),
      structuralIssues: NO_ISSUES,
      policy: "deterministic-conservative-v1",
      semanticUniqueness: "not-proven",
    });
  }

  return Object.freeze({
    ready: true,
    status: "pedagogically-ready",
    exercise: structural.exercise,
    issues: NO_ISSUES,
    policy: "deterministic-conservative-v1",
    semanticUniqueness: "not-proven",
  });
}
