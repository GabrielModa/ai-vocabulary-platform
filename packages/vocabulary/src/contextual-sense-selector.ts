import { z } from "zod";
import type { LearningCandidate } from "./candidate-pipeline.js";
import type { LexicalContent } from "./content.js";
import type { ContextualSenseDecision, WordKnowledgeContext } from "./lexical-knowledge.js";

const identifier = z.string().trim().min(1).max(200);

export const contextualSenseSelectionSchema = z
  .object({
    selectedSenseId: identifier,
    confidence: z.number().min(0).max(1),
    reasonCodes: z.array(identifier).min(1).max(10),
  })
  .strict();

export type ContextualSenseSelection = z.infer<typeof contextualSenseSelectionSchema>;

export interface ContextualSenseSelectorRequest {
  readonly candidateId: string;
  readonly displayForm: string;
  readonly normalizedLemma: string;
  readonly proposedPartOfSpeech?: string;
  readonly context: WordKnowledgeContext;
  readonly allowedSenses: readonly {
    readonly senseId: string;
    readonly definition: string;
    readonly partOfSpeech: string;
  }[];
}

export interface ContextualSenseSelectorPort {
  readonly decidedBy?: "deterministic-context-selector" | "contextual-ai-selector";
  select(request: ContextualSenseSelectorRequest): Promise<unknown>;
}

const CONTEXT_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "on",
  "the",
  "to",
  "vocabulary",
  "with",
]);

function contextTokens(value: string): ReadonlySet<string> {
  return new Set(
    value
      .normalize("NFKC")
      .toLocaleLowerCase("en-US")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 2 && !CONTEXT_STOP_WORDS.has(token)),
  );
}

/** Selects only when one verified definition explicitly contains more topic terms than every peer. */
export function selectContextualSenseDeterministically(
  request: ContextualSenseSelectorRequest,
): ContextualSenseSelection | undefined {
  const topicTokens = contextTokens(request.context.topic);
  if (topicTokens.size === 0) return undefined;

  const scored = request.allowedSenses
    .map((sense) => {
      const definitionTokens = contextTokens(sense.definition);
      const score = [...topicTokens].filter((token) => definitionTokens.has(token)).length;
      return { sense, score };
    })
    .sort((left, right) => right.score - left.score);
  const best = scored[0];
  const runnerUp = scored[1];

  if (!best || best.score === 0 || best.score === runnerUp?.score) return undefined;

  return Object.freeze({
    selectedSenseId: best.sense.senseId,
    confidence: 1,
    reasonCodes: ["exact-topic-definition-match", "deterministic-verified-evidence"],
  });
}

export interface SelectContextualSenseInput {
  readonly candidate: LearningCandidate;
  readonly context: WordKnowledgeContext;
  readonly selector?: ContextualSenseSelectorPort;
}

export type SelectContextualSenseResult =
  | {
      readonly ok: true;
      readonly selectedSense: LexicalContent;
      readonly decision: ContextualSenseDecision;
    }
  | {
      readonly ok: false;
      readonly code:
        | "no-selectable-senses"
        | "selector-unavailable"
        | "invalid-selector-response"
        | "selected-sense-not-allowed";
      readonly message: string;
    };

function failure(
  code: Exclude<SelectContextualSenseResult, { readonly ok: true }>["code"],
  message: string,
): SelectContextualSenseResult {
  return Object.freeze({ ok: false, code, message });
}

function selectableSenses(candidate: LearningCandidate): readonly LexicalContent[] {
  const proposedPartOfSpeech = candidate.proposedPartOfSpeech;
  return Object.freeze(
    candidate.availableSenses.filter(
      (sense) =>
        Boolean(sense.definition) &&
        (!proposedPartOfSpeech || sense.partOfSpeech === proposedPartOfSpeech),
    ),
  );
}

function selectorRequest(
  input: SelectContextualSenseInput,
  senses: readonly LexicalContent[],
): ContextualSenseSelectorRequest {
  return Object.freeze({
    candidateId: input.candidate.candidateId,
    displayForm: input.candidate.displayForm,
    normalizedLemma: input.candidate.normalizedLemma,
    ...(input.candidate.proposedPartOfSpeech
      ? {
          proposedPartOfSpeech: input.candidate.proposedPartOfSpeech,
        }
      : {}),
    context: Object.freeze({ ...input.context }),
    allowedSenses: Object.freeze(
      senses.map((sense) =>
        Object.freeze({
          senseId: sense.senseId,
          definition: sense.definition ?? "",
          partOfSpeech: sense.partOfSpeech,
        }),
      ),
    ),
  });
}

export async function selectContextualSense(
  input: SelectContextualSenseInput,
): Promise<SelectContextualSenseResult> {
  const senses = selectableSenses(input.candidate);
  if (senses.length === 0) {
    return failure("no-selectable-senses", "The candidate has no verified lexical sense to select");
  }

  const onlySense = senses.length === 1 ? senses[0] : undefined;
  if (onlySense) {
    return Object.freeze({
      ok: true,
      selectedSense: onlySense,
      decision: Object.freeze({
        selectedSenseId: onlySense.senseId,
        resolution: "auto-selected",
        confidence: 1,
        reasonCodes: Object.freeze(["single-selectable-sense", "verified-lexical-source"]),
        decidedBy: "single-verified-sense",
      }),
    });
  }

  if (!input.selector) {
    return failure(
      "selector-unavailable",
      "A contextual selector is required for ambiguous candidates",
    );
  }

  let raw: unknown;
  try {
    raw = await input.selector.select(selectorRequest(input, senses));
  } catch {
    return failure(
      "invalid-selector-response",
      "The contextual selector did not return a valid decision",
    );
  }

  const parsed = contextualSenseSelectionSchema.safeParse(raw);
  if (!parsed.success) {
    return failure(
      "invalid-selector-response",
      "The contextual selector did not return a valid decision",
    );
  }

  const selectedSense = senses.find(({ senseId }) => senseId === parsed.data.selectedSenseId);
  if (!selectedSense) {
    return failure(
      "selected-sense-not-allowed",
      "The contextual selector chose a sense outside the allowed evidence",
    );
  }

  return Object.freeze({
    ok: true,
    selectedSense,
    decision: Object.freeze({
      selectedSenseId: selectedSense.senseId,
      resolution: "auto-selected",
      confidence: parsed.data.confidence,
      reasonCodes: Object.freeze([...parsed.data.reasonCodes]),
      decidedBy: input.selector.decidedBy ?? "contextual-ai-selector",
    }),
  });
}
