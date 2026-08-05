import type { WordKnowledge } from "./lexical-knowledge.js";

export interface DefinitionChoiceDistractorEvidence {
  readonly knowledge: WordKnowledge;
  readonly frequencyPercentile?: number;
}

export interface SelectedDefinitionChoiceDistractor {
  readonly knowledge: WordKnowledge;
  readonly score: number;
  readonly reasons: readonly string[];
}

export type SelectDefinitionChoiceDistractorsResult =
  | {
      readonly ok: true;
      readonly strategy: "resolved-pos-context-frequency-deterministic";
      readonly targetKnowledgeId: string;
      readonly distractors: readonly SelectedDefinitionChoiceDistractor[];
    }
  | {
      readonly ok: false;
      readonly code: "invalid-distractor-count" | "insufficient-compatible-knowledge";
      readonly message: string;
      readonly compatibleKnowledgeCount: number;
    };

export interface SelectDefinitionChoiceDistractorsInput {
  readonly target: DefinitionChoiceDistractorEvidence;
  readonly pool: readonly DefinitionChoiceDistractorEvidence[];
  readonly count?: number;
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

function boundedPercentile(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.min(1, Math.max(0, value));
}

function frequencySimilarityScore(
  target: number | undefined,
  candidate: number | undefined,
): number {
  const normalizedTarget = boundedPercentile(target);
  const normalizedCandidate = boundedPercentile(candidate);

  if (normalizedTarget === undefined || normalizedCandidate === undefined) {
    return 0;
  }

  return Math.round((1 - Math.abs(normalizedTarget - normalizedCandidate)) * 1_000);
}

function lengthSimilarityScore(target: string, candidate: string): number {
  const distance = Math.abs(normalize(target).length - normalize(candidate).length);

  return Math.max(0, 100 - distance);
}

function compatibilityScore(
  target: DefinitionChoiceDistractorEvidence,
  candidate: DefinitionChoiceDistractorEvidence,
): {
  readonly score: number;
  readonly reasons: readonly string[];
} {
  const reasons: string[] = ["same-part-of-speech"];
  let score = 1_000;

  if (candidate.knowledge.context.learnerLevel === target.knowledge.context.learnerLevel) {
    score += 300;
    reasons.push("same-learner-level");
  }

  if (normalize(candidate.knowledge.context.topic) === normalize(target.knowledge.context.topic)) {
    score += 200;
    reasons.push("same-topic");
  }

  const frequencyScore = frequencySimilarityScore(
    target.frequencyPercentile,
    candidate.frequencyPercentile,
  );
  if (frequencyScore > 0) {
    score += frequencyScore;
    reasons.push("similar-frequency");
  }

  score += lengthSimilarityScore(target.knowledge.displayForm, candidate.knowledge.displayForm);
  reasons.push("similar-display-length");

  return Object.freeze({
    score,
    reasons: Object.freeze(reasons),
  });
}

function failure(
  code: Exclude<SelectDefinitionChoiceDistractorsResult, { readonly ok: true }>["code"],
  message: string,
  compatibleKnowledgeCount: number,
): SelectDefinitionChoiceDistractorsResult {
  return Object.freeze({
    ok: false,
    code,
    message,
    compatibleKnowledgeCount,
  });
}

export function selectDefinitionChoiceDistractors(
  input: SelectDefinitionChoiceDistractorsInput,
): SelectDefinitionChoiceDistractorsResult {
  const requestedCount = input.count ?? 3;
  if (!Number.isSafeInteger(requestedCount) || requestedCount < 1) {
    return failure(
      "invalid-distractor-count",
      "Distractor count must be a positive safe integer",
      0,
    );
  }

  const targetLemma = normalize(input.target.knowledge.normalizedLemma);
  const targetDisplayForm = normalize(input.target.knowledge.displayForm);
  const targetDefinition = normalize(input.target.knowledge.selectedSense.definition);

  const seenKnowledgeIds = new Set<string>([normalize(input.target.knowledge.knowledgeId)]);
  const seenLemmas = new Set<string>([targetLemma]);
  const seenDisplayForms = new Set<string>([targetDisplayForm]);
  const seenSenseIds = new Set<string>([normalize(input.target.knowledge.selectedSense.senseId)]);
  const seenDefinitions = new Set<string>([targetDefinition]);

  const compatible = input.pool.flatMap((candidate) => {
    const knowledge = candidate.knowledge;
    if (knowledge.partOfSpeech !== input.target.knowledge.partOfSpeech) {
      return [];
    }

    const knowledgeId = normalize(knowledge.knowledgeId);
    const lemma = normalize(knowledge.normalizedLemma);
    const displayForm = normalize(knowledge.displayForm);
    const senseId = normalize(knowledge.selectedSense.senseId);
    const definition = normalize(knowledge.selectedSense.definition);

    if (
      !knowledgeId ||
      !lemma ||
      !displayForm ||
      !senseId ||
      !definition ||
      seenKnowledgeIds.has(knowledgeId) ||
      seenLemmas.has(lemma) ||
      seenDisplayForms.has(displayForm) ||
      seenSenseIds.has(senseId) ||
      seenDefinitions.has(definition)
    ) {
      return [];
    }

    seenKnowledgeIds.add(knowledgeId);
    seenLemmas.add(lemma);
    seenDisplayForms.add(displayForm);
    seenSenseIds.add(senseId);
    seenDefinitions.add(definition);

    const compatibility = compatibilityScore(input.target, candidate);

    return [
      Object.freeze({
        knowledge,
        score: compatibility.score,
        reasons: compatibility.reasons,
      }),
    ];
  });

  const sorted = [...compatible].sort((left, right) => {
    if (left.score !== right.score) {
      return right.score - left.score;
    }

    return left.knowledge.knowledgeId.localeCompare(right.knowledge.knowledgeId, "en-US");
  });

  if (sorted.length < requestedCount) {
    return failure(
      "insufficient-compatible-knowledge",
      `Expected ${String(requestedCount)} compatible distractors`,
      sorted.length,
    );
  }

  return Object.freeze({
    ok: true,
    strategy: "resolved-pos-context-frequency-deterministic",
    targetKnowledgeId: input.target.knowledge.knowledgeId,
    distractors: Object.freeze(
      sorted.slice(0, requestedCount).map((entry) =>
        Object.freeze({
          knowledge: entry.knowledge,
          score: entry.score,
          reasons: entry.reasons,
        }),
      ),
    ),
  });
}
