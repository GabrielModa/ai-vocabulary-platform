import type { PublishedDefinitionChoice } from "./definition-choice-publisher.js";
import type { ContentProvenance } from "./content.js";

export interface PersistentDefinitionChoiceExercise {
  readonly ok: true;
  readonly exerciseId: string;
  readonly exerciseKind: "definition-choice";
  readonly candidateId: string;
  readonly knowledgeId: string;
  readonly senseId: string;
  readonly prompt: string;
  readonly answer: string;
  readonly options: readonly [string, string, string, string];
  readonly choiceIds: readonly [string, string, string, string];
  readonly provenance: readonly ContentProvenance[];
  readonly compositionStrategy: "official-definition-deterministic-knowledge-distractors";
}

export type MapDefinitionChoicePublicationResult =
  | {
      readonly ok: true;
      readonly exercise: PersistentDefinitionChoiceExercise;
    }
  | {
      readonly ok: false;
      readonly code: "invalid-option-count" | "missing-correct-choice";
      readonly message: string;
    };

export function mapDefinitionChoicePublication(
  publication: PublishedDefinitionChoice,
): MapDefinitionChoicePublicationResult {
  const [first, second, third, fourth] = publication.exercise.options;

  if (
    first === undefined ||
    second === undefined ||
    third === undefined ||
    fourth === undefined ||
    publication.exercise.options.length !== 4
  ) {
    return Object.freeze({
      ok: false,
      code: "invalid-option-count",
      message: "Persistent definition choice requires exactly four options",
    });
  }

  const correct = publication.exercise.options.find(
    ({ choiceId }) => choiceId === publication.exercise.correctChoiceId,
  );

  if (correct === undefined) {
    return Object.freeze({
      ok: false,
      code: "missing-correct-choice",
      message: "Definition choice correct option is missing",
    });
  }

  return Object.freeze({
    ok: true,
    exercise: Object.freeze({
      ok: true,
      exerciseId: publication.exercise.exerciseId,
      exerciseKind: "definition-choice",
      candidateId: publication.exercise.candidateId,
      knowledgeId: publication.exercise.knowledgeId,
      senseId: publication.exercise.senseId,
      prompt: publication.exercise.prompt,
      answer: correct.label,
      options: Object.freeze([first.label, second.label, third.label, fourth.label] as [
        string,
        string,
        string,
        string,
      ]),
      choiceIds: Object.freeze([
        first.choiceId,
        second.choiceId,
        third.choiceId,
        fourth.choiceId,
      ] as [string, string, string, string]),
      provenance: Object.freeze([...publication.exercise.provenance]),
      compositionStrategy: "official-definition-deterministic-knowledge-distractors",
    }),
  });
}
