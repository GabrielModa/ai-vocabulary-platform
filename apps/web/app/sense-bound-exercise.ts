export type ExerciseKind = "cloze" | "definition-choice";

export function definitionRecallChallenge(definition: string): string {
  return `Which word matches this meaning: "${definition}"? ___`;
}
