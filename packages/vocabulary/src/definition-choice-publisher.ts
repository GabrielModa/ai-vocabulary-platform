import {
  composeDefinitionChoice,
  type DefinitionChoiceExercise,
} from "./definition-choice-composer.js";
import {
  selectDefinitionChoiceDistractors,
  type DefinitionChoiceDistractorEvidence,
} from "./definition-choice-distractor-selector.js";
import { planExerciseCapabilities } from "./exercise-capability-planner.js";

export interface PublishedDefinitionChoice {
  readonly publicationId: string;
  readonly status: "published";
  readonly strategy: "definition-choice";
  readonly exercise: DefinitionChoiceExercise;
  readonly selectedDistractorKnowledgeIds: readonly string[];
}

export type PublishDefinitionChoiceResult =
  | {
      readonly ok: true;
      readonly publication: PublishedDefinitionChoice;
    }
  | {
      readonly ok: false;
      readonly code:
        "capability-unavailable" | "insufficient-compatible-knowledge" | "composition-failed";
      readonly message: string;
    };

export interface PublishDefinitionChoiceInput {
  readonly target: DefinitionChoiceDistractorEvidence;
  readonly pool: readonly DefinitionChoiceDistractorEvidence[];
}

function publicationId(exercise: DefinitionChoiceExercise): string {
  return `publication:${encodeURIComponent(exercise.exerciseId)}:v1`;
}

export function publishDefinitionChoice(
  input: PublishDefinitionChoiceInput,
): PublishDefinitionChoiceResult {
  const capabilityPlan = planExerciseCapabilities(input.target.knowledge);

  if (!capabilityPlan.available.includes("definition-choice")) {
    return Object.freeze({
      ok: false,
      code: "capability-unavailable",
      message: "Definition choice is unavailable for the target knowledge",
    });
  }

  const selection = selectDefinitionChoiceDistractors({
    target: input.target,
    pool: input.pool,
  });

  if (!selection.ok) {
    return Object.freeze({
      ok: false,
      code: "insufficient-compatible-knowledge",
      message: selection.message,
    });
  }

  const composition = composeDefinitionChoice({
    knowledge: input.target.knowledge,
    capabilityPlan,
    distractors: selection.distractors.map(({ knowledge }) => knowledge),
  });

  if (!composition.ok) {
    return Object.freeze({
      ok: false,
      code: "composition-failed",
      message: composition.message,
    });
  }

  return Object.freeze({
    ok: true,
    publication: Object.freeze({
      publicationId: publicationId(composition.exercise),
      status: "published",
      strategy: "definition-choice",
      exercise: composition.exercise,
      selectedDistractorKnowledgeIds: Object.freeze(
        selection.distractors.map(({ knowledge }) => knowledge.knowledgeId),
      ),
    }),
  });
}
