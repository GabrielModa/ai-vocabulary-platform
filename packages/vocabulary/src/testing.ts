import type {
  CandidateIdFactory,
  LanguageDetector,
  TypedCandidateAnalysisRequest,
  TypedCandidateAnalyzer,
} from "./typed-input.js";
import type {
  TopicCandidateGenerationRequest,
  TopicCandidateGenerator,
} from "./topic-generation.js";

export class FixedLanguageDetector implements LanguageDetector {
  readonly inputs: string[] = [];
  constructor(private readonly language: string) {}
  detect(text: string): Promise<string> {
    this.inputs.push(text);
    return Promise.resolve(this.language);
  }
}

export class SequentialCandidateIdFactory implements CandidateIdFactory {
  #next = 1;
  next(): string {
    const id = `candidate_${String(this.#next).padStart(4, "0")}`;
    this.#next += 1;
    return id;
  }
}

export class DeterministicTypedCandidateAnalyzer implements TypedCandidateAnalyzer {
  readonly requests: TypedCandidateAnalysisRequest[] = [];
  constructor(
    private readonly translations: Readonly<Record<string, string>>,
    private readonly outputOverride?: unknown,
  ) {}
  analyze(request: TypedCandidateAnalysisRequest): Promise<unknown> {
    this.requests.push(structuredClone(request));
    if (this.outputOverride !== undefined) return Promise.resolve(this.outputOverride);
    return Promise.resolve(
      request.entries.map((sourceTerm) => ({
        sourceTerm,
        englishTerm: this.translations[sourceTerm] ?? sourceTerm,
        sourceLanguage: request.detectedLanguage,
        sense: `validated sense for ${this.translations[sourceTerm] ?? sourceTerm}`,
        partOfSpeech: "other",
      })),
    );
  }
}

const topicCategories = [
  "noun",
  "verb",
  "adjective",
  "collocation",
  "phrasal-verb",
  "expression",
] as const;

export class DeterministicTopicCandidateGenerator implements TopicCandidateGenerator {
  readonly requests: TopicCandidateGenerationRequest[] = [];
  constructor(private readonly outputOverride?: unknown) {}
  generate(request: TopicCandidateGenerationRequest): Promise<unknown> {
    this.requests.push(structuredClone(request));
    if (this.outputOverride !== undefined) return Promise.resolve(this.outputOverride);
    return Promise.resolve(
      Array.from({ length: request.requestedCount }, (_, index) => ({
        englishTerm: `${request.topic} term ${String(index + 1)}`,
        sense: `${request.level} sense ${String(index + 1)}`,
        partOfSpeech: topicCategories[index % topicCategories.length],
        sourceContext: request.topic,
      })),
    );
  }
}
