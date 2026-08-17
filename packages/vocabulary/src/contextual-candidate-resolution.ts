import type { LearningCandidate, SelectedLexicalSense } from "./candidate-pipeline.js";
import {
  selectContextualSense,
  type ContextualSenseSelectorPort,
} from "./contextual-sense-selector.js";
import type { ContextualSenseDecision, WordKnowledgeContext } from "./lexical-knowledge.js";

export interface ResolveCandidateContextuallyInput {
  readonly candidate: LearningCandidate;
  readonly context: WordKnowledgeContext;
  readonly selector?: ContextualSenseSelectorPort;
}

export type ResolveCandidateContextuallyResult =
  | {
      readonly ok: true;
      readonly status: "resolved";
      readonly candidate: LearningCandidate;
      readonly decision: ContextualSenseDecision;
    }
  | {
      readonly ok: true;
      readonly status: "needs-review";
      readonly candidate: LearningCandidate;
    }
  | {
      readonly ok: false;
      readonly code: "no-selectable-senses" | "invalid-contextual-selection";
      readonly message: string;
    };

function selectedLexicalSense(
  candidate: LearningCandidate,
  decision: ContextualSenseDecision,
): SelectedLexicalSense | undefined {
  const selected = candidate.availableSenses.find(
    ({ senseId }) => senseId === decision.selectedSenseId,
  );
  if (!selected?.definition) return undefined;

  return Object.freeze({
    senseId: selected.senseId,
    definition: selected.definition,
    partOfSpeech: selected.partOfSpeech,
    provenance: selected.provenance,
    confirmedBy:
      decision.decidedBy === "contextual-ai-selector"
        ? "contextual-ai-selection"
        : decision.decidedBy === "deterministic-context-selector"
          ? "deterministic-context-selection"
          : "unique-provider-match",
  });
}

function selectableSenseCount(candidate: LearningCandidate): number {
  return candidate.availableSenses.filter(
    (sense) =>
      Boolean(sense.definition) &&
      (!candidate.proposedPartOfSpeech || sense.partOfSpeech === candidate.proposedPartOfSpeech),
  ).length;
}

export async function resolveCandidateContextually(
  input: ResolveCandidateContextuallyInput,
): Promise<ResolveCandidateContextuallyResult> {
  const selection = await selectContextualSense({
    candidate: input.candidate,
    context: input.context,
    ...(input.selector ? { selector: input.selector } : {}),
  });

  if (!selection.ok) {
    if (
      selection.code === "selector-unavailable" ||
      selection.code === "invalid-selector-response" ||
      selection.code === "low-selector-confidence" ||
      selection.code === "selected-sense-not-allowed"
    ) {
      return Object.freeze({
        ok: true,
        status: "needs-review",
        candidate: input.candidate,
      });
    }

    return Object.freeze({
      ok: false,
      code: "no-selectable-senses",
      message: selection.message,
    });
  }

  const automaticAmbiguousSelection =
    selectableSenseCount(input.candidate) > 1 &&
    selection.decision.decidedBy !== "learner" &&
    selection.decision.decidedBy !== "deterministic-context-selector";
  if (automaticAmbiguousSelection) {
    return Object.freeze({
      ok: true,
      status: "needs-review",
      candidate: input.candidate,
    });
  }

  const selectedSense = selectedLexicalSense(input.candidate, selection.decision);
  if (!selectedSense) {
    return Object.freeze({
      ok: false,
      code: "invalid-contextual-selection",
      message: "The contextual selection must resolve to a verified lexical definition",
    });
  }

  return Object.freeze({
    ok: true,
    status: "resolved",
    candidate: Object.freeze({
      ...input.candidate,
      lexicalStatus: "verified",
      selectedSense,
    }),
    decision: selection.decision,
  });
}
