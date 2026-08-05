import type { ExerciseCapability, WordKnowledge } from "./lexical-knowledge.js";

export type ExerciseCapabilityUnavailableReason =
  | "missing-verified-definition"
  | "missing-target-bearing-official-example"
  | "missing-pronunciation"
  | "missing-image-evidence"
  | "missing-collocation-evidence";

export interface UnavailableExerciseCapability {
  readonly capability: ExerciseCapability;
  readonly reason: ExerciseCapabilityUnavailableReason;
}

export interface ExerciseCapabilityPlan {
  readonly knowledgeId: string;
  readonly available: readonly ExerciseCapability[];
  readonly unavailable: readonly UnavailableExerciseCapability[];
}

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").trim();
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function containsTarget(sentence: string, target: string): boolean {
  const normalizedSentence = normalized(sentence);
  const normalizedTarget = normalized(target);

  if (!normalizedSentence || !normalizedTarget) {
    return false;
  }

  const escapedTarget = escapeRegularExpression(normalizedTarget);
  const targetPattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapedTarget}([^\\p{L}\\p{N}]|$)`, "iu");

  return targetPattern.test(normalizedSentence);
}

export function planExerciseCapabilities(knowledge: WordKnowledge): ExerciseCapabilityPlan {
  const available: ExerciseCapability[] = [];
  const unavailable: UnavailableExerciseCapability[] = [];

  if (knowledge.selectedSense.definition.trim()) {
    available.push("definition-choice", "word-definition-match");
  } else {
    unavailable.push(
      {
        capability: "definition-choice",
        reason: "missing-verified-definition",
      },
      {
        capability: "word-definition-match",
        reason: "missing-verified-definition",
      },
    );
  }

  const hasTargetBearingExample = knowledge.evidence.officialExamples.some(({ sentence }) =>
    containsTarget(sentence, knowledge.normalizedLemma),
  );

  if (hasTargetBearingExample) {
    available.push("verified-cloze");
  } else {
    unavailable.push({
      capability: "verified-cloze",
      reason: "missing-target-bearing-official-example",
    });
  }

  if (knowledge.evidence.pronunciations.length > 0) {
    available.push("audio-recognition");
  } else {
    unavailable.push({
      capability: "audio-recognition",
      reason: "missing-pronunciation",
    });
  }

  unavailable.push(
    {
      capability: "image-recognition",
      reason: "missing-image-evidence",
    },
    {
      capability: "collocation",
      reason: "missing-collocation-evidence",
    },
  );

  return Object.freeze({
    knowledgeId: knowledge.knowledgeId,
    available: Object.freeze([...available]),
    unavailable: Object.freeze(unavailable.map((entry) => Object.freeze({ ...entry }))),
  });
}
