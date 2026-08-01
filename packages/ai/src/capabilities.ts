import type { AiResult, ExecutionPolicy, ExecutionVersions } from "./execution.js";

interface CapabilityRequest {
  readonly policy: ExecutionPolicy;
  readonly versions: ExecutionVersions;
}

export interface TextGenerationRequest extends CapabilityRequest {
  readonly input: string;
  readonly locale: string;
}
export interface TextGenerationOutput {
  readonly text: string;
}
export interface TextGenerationCapability {
  generate(request: TextGenerationRequest): Promise<AiResult<TextGenerationOutput>>;
}

export interface ImageAnalysisRequest extends CapabilityRequest {
  readonly mediaReference: string;
  readonly locale: string;
}
export interface ImageAnalysisOutput {
  readonly labels: readonly string[];
}
export interface ImageAnalysisCapability {
  analyze(request: ImageAnalysisRequest): Promise<AiResult<ImageAnalysisOutput>>;
}

export interface SpeechSynthesisRequest extends CapabilityRequest {
  readonly text: string;
  readonly voice: string;
}
export interface SpeechSynthesisOutput {
  readonly audioReference: string;
  readonly durationSeconds: number;
}
export interface SpeechSynthesisCapability {
  synthesize(request: SpeechSynthesisRequest): Promise<AiResult<SpeechSynthesisOutput>>;
}

export interface TranscriptionRequest extends CapabilityRequest {
  readonly audioReference: string;
  readonly locale: string;
}
export interface TranscriptionOutput {
  readonly text: string;
}
export interface TranscriptionCapability {
  transcribe(request: TranscriptionRequest): Promise<AiResult<TranscriptionOutput>>;
}

export interface PronunciationAssessmentRequest extends CapabilityRequest {
  readonly audioReference: string;
  readonly expectedText: string;
  readonly locale: string;
}
export interface PronunciationAssessmentOutput {
  readonly score: number;
  readonly feedbackCodes: readonly string[];
}
export interface PronunciationAssessmentCapability {
  assess(request: PronunciationAssessmentRequest): Promise<AiResult<PronunciationAssessmentOutput>>;
}
