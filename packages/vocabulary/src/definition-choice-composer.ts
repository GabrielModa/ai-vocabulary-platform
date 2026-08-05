import type { ContentProvenance } from "./content.js";
import type { ExerciseCapabilityPlan } from "./exercise-capability-planner.js";
import type { WordKnowledge } from "./lexical-knowledge.js";

export interface DefinitionChoiceOption {
  readonly choiceId: string;
  readonly label: string;
  readonly knowledgeId: string;
}

export interface DefinitionChoiceExercise {
  readonly exerciseId: string;
  readonly kind: "definition-choice";
  readonly knowledgeId: string;
  readonly senseId: string;
  readonly prompt: string;
  readonly options: readonly DefinitionChoiceOption[];
  readonly correctChoiceId: string;
  readonly provenance: readonly ContentProvenance[];
}

export type ComposeDefinitionChoiceResult =
  | {
      readonly ok: true;
      readonly exercise: DefinitionChoiceExercise;
    }
  | {
      readonly ok: false;
      readonly code:
        | "capability-unavailable"
        | "invalid-distractor-count"
        | "duplicate-choice"
        | "part-of-speech-mismatch";
      readonly message: string;
    };

export interface ComposeDefinitionChoiceInput {
  readonly knowledge: WordKnowledge;
  readonly capabilityPlan: ExerciseCapabilityPlan;
  readonly distractors: readonly WordKnowledge[];
}

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

function choiceId(knowledgeId: string): string {
  return `choice:${encodeURIComponent(knowledgeId)}`;
}

function exerciseId(knowledge: WordKnowledge): string {
  return `exercise:${encodeURIComponent(knowledge.knowledgeId)}:definition-choice:v1`;
}

function failure(
  code: Exclude<ComposeDefinitionChoiceResult, { readonly ok: true }>["code"],
  message: string,
): ComposeDefinitionChoiceResult {
  return Object.freeze({ ok: false, code, message });
}

export function composeDefinitionChoice(
  input: ComposeDefinitionChoiceInput,
): ComposeDefinitionChoiceResult {
  if (!input.capabilityPlan.available.includes("definition-choice")) {
    return failure(
      "capability-unavailable",
      "Definition choice is not supported by this lexical knowledge",
    );
  }

  if (input.capabilityPlan.knowledgeId !== input.knowledge.knowledgeId) {
    return failure(
      "capability-unavailable",
      "The capability plan does not belong to the target knowledge",
    );
  }

  if (input.distractors.length !== 3) {
    return failure(
      "invalid-distractor-count",
      "Definition choice requires exactly three distractors",
    );
  }

  if (input.distractors.some(({ partOfSpeech }) => partOfSpeech !== input.knowledge.partOfSpeech)) {
    return failure(
      "part-of-speech-mismatch",
      "Definition choice distractors must share the target part of speech",
    );
  }

  const choices = [input.knowledge, ...input.distractors];
  const normalizedLabels = choices.map(({ displayForm }) => normalized(displayForm));
  const normalizedKnowledgeIds = choices.map(({ knowledgeId }) => normalized(knowledgeId));

  if (
    new Set(normalizedLabels).size !== choices.length ||
    new Set(normalizedKnowledgeIds).size !== choices.length
  ) {
    return failure("duplicate-choice", "Definition choice options must be unique");
  }

  const options = Object.freeze(
    choices.map((knowledge) =>
      Object.freeze({
        choiceId: choiceId(knowledge.knowledgeId),
        label: knowledge.displayForm,
        knowledgeId: knowledge.knowledgeId,
      }),
    ),
  );
  const correctChoiceId = choiceId(input.knowledge.knowledgeId);

  return Object.freeze({
    ok: true,
    exercise: Object.freeze({
      exerciseId: exerciseId(input.knowledge),
      kind: "definition-choice",
      knowledgeId: input.knowledge.knowledgeId,
      senseId: input.knowledge.selectedSense.senseId,
      prompt: input.knowledge.selectedSense.definition,
      options,
      correctChoiceId,
      provenance: Object.freeze([...input.knowledge.provenance]),
    }),
  });
}
