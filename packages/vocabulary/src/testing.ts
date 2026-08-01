import type {
  CandidateIdFactory,
  LanguageDetector,
  TypedCandidateAnalysisRequest,
  TypedCandidateAnalyzer,
} from "./typed-input.js";

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
