import type { LocalVocabularyRequest } from "@vocabulary/ai";

const smokeCases: readonly LocalVocabularyRequest[] = Object.freeze([
  { topic: "football", level: "A2", requestedCount: 6 },
  { topic: "work", level: "B1", requestedCount: 6 },
]);

const extendedCases: readonly LocalVocabularyRequest[] = Object.freeze([
  ...smokeCases,
  { topic: "travel", level: "B2", requestedCount: 8 },
  { topic: "technology", level: "C1", requestedCount: 6 },
  { topic: "education", level: "C2", requestedCount: 6 },
]);

const coverageCases: readonly LocalVocabularyRequest[] = Object.freeze([
  { topic: "family", level: "A2", requestedCount: 6 },
  { topic: "shopping", level: "B1", requestedCount: 6 },
  { topic: "home", level: "B1", requestedCount: 6 },
  { topic: "environment", level: "B2", requestedCount: 6 },
  { topic: "money", level: "C1", requestedCount: 6 },
]);

const modelComparisonCases: readonly LocalVocabularyRequest[] = Object.freeze([
  { topic: "photography", level: "A2", requestedCount: 6 },
  { topic: "gardening", level: "B1", requestedCount: 6 },
  { topic: "negotiation", level: "C1", requestedCount: 6 },
]);

export function selectVocabularyBenchmarkCases(
  arguments_: readonly string[],
): readonly LocalVocabularyRequest[] {
  if (arguments_.includes("--model-comparison")) return modelComparisonCases;
  if (arguments_.includes("--coverage")) return coverageCases;
  if (arguments_.includes("--extended")) return extendedCases;
  return smokeCases;
}
