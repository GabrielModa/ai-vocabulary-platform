export type ExampleCefrLevel = "A2" | "B1" | "B2" | "C1" | "C2";

export type ExampleQualityReasonCode =
  | "too-short"
  | "level-length-exceeded"
  | "insufficient-context"
  | "target-missing"
  | "target-repeated"
  | "missing-terminal-punctuation"
  | "contains-gap"
  | "contains-url"
  | "contains-control-character"
  | "meta-definition";

export interface GeneratedExampleQualityAssessment {
  readonly status: "accepted" | "rejected";
  readonly score: number;
  readonly wordCount: number;
  readonly contextWordCount: number;
  readonly targetOccurrences: number;
  readonly reasonCodes: readonly ExampleQualityReasonCode[];
}

const maximumWordsByLevel: Readonly<Record<ExampleCefrLevel, number>> = {
  A2: 14,
  B1: 18,
  B2: 22,
  C1: 26,
  C2: 30,
};

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function words(value: string): readonly string[] {
  return value.match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu) ?? [];
}

function targetPattern(term: string): RegExp {
  return new RegExp("(^|[^\\p{L}\\p{N}])(" + escapePattern(term) + ")(?=[^\\p{L}\\p{N}]|$)", "giu");
}

export function maximumExampleWords(level: ExampleCefrLevel): number {
  return maximumWordsByLevel[level];
}

export function assessGeneratedExample(input: {
  readonly sentence: string;
  readonly term: string;
  readonly level: ExampleCefrLevel;
}): GeneratedExampleQualityAssessment {
  const sentence = input.sentence.trim();
  const sentenceWords = words(sentence);
  const matches = [...sentence.matchAll(targetPattern(input.term))];
  const withoutTarget = sentence.replace(targetPattern(input.term), "$1 ");
  const contextWordCount = words(withoutTarget).length;
  const reasonCodes: ExampleQualityReasonCode[] = [];

  if (sentenceWords.length < 5) reasonCodes.push("too-short");
  if (sentenceWords.length > maximumWordsByLevel[input.level]) {
    reasonCodes.push("level-length-exceeded");
  }
  if (contextWordCount < 4) reasonCodes.push("insufficient-context");
  if (matches.length === 0) reasonCodes.push("target-missing");
  if (matches.length > 1) reasonCodes.push("target-repeated");
  if (!/[.!?]["]?$/u.test(sentence)) reasonCodes.push("missing-terminal-punctuation");
  if (/_{2,}|\[blank\]|\bblank\b/iu.test(sentence)) reasonCodes.push("contains-gap");
  if (/https?:\/\//iu.test(sentence)) reasonCodes.push("contains-url");
  let containsControlCharacter = false;
  for (let index = 0; index < sentence.length; index += 1) {
    if (sentence.charCodeAt(index) < 32) {
      containsControlCharacter = true;
      break;
    }
  }
  if (containsControlCharacter) reasonCodes.push("contains-control-character");
  const termDefinesItself = new RegExp(
    escapePattern(input.term) + "\\s+(?:means?|is defined as)\\b",
    "iu",
  ).test(sentence);
  if (
    /\b(?:the\s+)?(?:word|term)\b.{0,40}\b(?:means?|definition)\b/iu.test(sentence) ||
    termDefinesItself
  ) {
    reasonCodes.push("meta-definition");
  }

  return Object.freeze({
    status: reasonCodes.length === 0 ? "accepted" : "rejected",
    score: Math.max(0, 100 - reasonCodes.length * 20),
    wordCount: sentenceWords.length,
    contextWordCount,
    targetOccurrences: matches.length,
    reasonCodes: Object.freeze(reasonCodes),
  });
}
