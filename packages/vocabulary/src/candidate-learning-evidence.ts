import type { CefrLevel } from "./model.js";

const CEFR_ORDER: readonly CefrLevel[] = ["A2", "B1", "B2", "C1", "C2"];
const STOP_WORDS = new Set(["a", "an", "and", "for", "in", "of", "on", "the", "to", "with"]);

export interface TopicRelevanceEvidence {
  readonly score: number;
  readonly reasonCodes: readonly string[];
}

export interface ProvisionalCefrEstimate {
  readonly level: CefrLevel;
  readonly status: "provisional";
  readonly confidence: number;
  readonly method: "subtlex-percentile-v1";
}

export interface CandidateLearningEvidence {
  readonly topicRelevance: TopicRelevanceEvidence;
  readonly cefrEstimate?: ProvisionalCefrEstimate;
  readonly levelDistance?: number;
}

export interface EvaluateCandidateLearningEvidenceInput {
  readonly topic: string;
  readonly requestedLevel: CefrLevel;
  readonly normalizedLemma: string;
  readonly verifiedDefinition?: string;
  readonly verifiedExamples: readonly string[];
  readonly selectionReasons: readonly string[];
  readonly frequencyPercentile?: number;
}

function tokens(value: string): ReadonlySet<string> {
  return new Set(
    value
      .normalize("NFKC")
      .toLocaleLowerCase("en-US")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  );
}

function intersects(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  return [...left].some((token) => right.has(token));
}

function topicEvidence(input: EvaluateCandidateLearningEvidenceInput): TopicRelevanceEvidence {
  const topic = tokens(input.topic);
  const lemma = tokens(input.normalizedLemma);
  if (topic.size > 0 && intersects(topic, lemma)) {
    return Object.freeze({ score: 1, reasonCodes: Object.freeze(["lemma-topic-match"]) });
  }
  if (input.verifiedDefinition && intersects(topic, tokens(input.verifiedDefinition))) {
    return Object.freeze({
      score: 1,
      reasonCodes: Object.freeze(["verified-definition-topic-match"]),
    });
  }
  if (input.verifiedExamples.some((example) => intersects(topic, tokens(example)))) {
    return Object.freeze({
      score: 0.75,
      reasonCodes: Object.freeze(["verified-example-topic-match"]),
    });
  }
  if (input.selectionReasons.includes("matched-request-context")) {
    return Object.freeze({
      score: 0.25,
      reasonCodes: Object.freeze(["ai-topic-suggestion-only"]),
    });
  }
  return Object.freeze({ score: 0, reasonCodes: Object.freeze(["no-topic-evidence"]) });
}

function cefrFromFrequency(percentile: number): CefrLevel {
  if (percentile >= 0.85) return "A2";
  if (percentile >= 0.7) return "B1";
  if (percentile >= 0.5) return "B2";
  if (percentile >= 0.3) return "C1";
  return "C2";
}

export function evaluateCandidateLearningEvidence(
  input: EvaluateCandidateLearningEvidenceInput,
): CandidateLearningEvidence {
  const topicRelevance = topicEvidence(input);
  const percentile = input.frequencyPercentile;
  if (percentile === undefined || !Number.isFinite(percentile)) {
    return Object.freeze({ topicRelevance });
  }

  const level = cefrFromFrequency(Math.min(1, Math.max(0, percentile)));
  const requestedIndex = CEFR_ORDER.indexOf(input.requestedLevel);
  const estimatedIndex = CEFR_ORDER.indexOf(level);

  return Object.freeze({
    topicRelevance,
    cefrEstimate: Object.freeze({
      level,
      status: "provisional",
      confidence: 0.55,
      method: "subtlex-percentile-v1",
    }),
    levelDistance: Math.abs(requestedIndex - estimatedIndex) / (CEFR_ORDER.length - 1),
  });
}
