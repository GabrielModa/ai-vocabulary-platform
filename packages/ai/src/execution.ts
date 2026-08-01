export type PrivacyClassification = "public" | "internal" | "personal" | "sensitive";
export type CacheEligibility = "eligible" | "ineligible";

export interface ExecutionPolicy {
  readonly privacy: PrivacyClassification;
  readonly cache: CacheEligibility;
  readonly timeoutMs: number;
  readonly signal?: AbortSignal;
}

export interface ExecutionVersions {
  readonly model: string;
  readonly prompt: string;
  readonly schema: string;
  readonly policy: string;
}

export interface Usage {
  readonly inputUnits: number;
  readonly outputUnits: number;
  readonly unit: "tokens" | "characters" | "seconds" | "images";
}

export interface Provenance {
  readonly provider: string;
  readonly capability: AiCapabilityName;
  readonly versions: ExecutionVersions;
  readonly generatedAt: string;
}

export interface AiResult<T> {
  readonly value: T;
  readonly uncertainty: number;
  readonly usage: Usage;
  readonly provenance: Provenance;
}

export type AiCapabilityName =
  | "text-generation"
  | "image-analysis"
  | "speech-synthesis"
  | "transcription"
  | "pronunciation-assessment";

export type AiErrorCode = "CANCELLED" | "INVALID_OUTPUT" | "PROVIDER_UNAVAILABLE" | "TIMEOUT";

export class AiCapabilityError extends Error {
  constructor(readonly code: AiErrorCode) {
    super(`AI capability failed: ${code}`);
    this.name = "AiCapabilityError";
  }
}

export function assertExecutionPolicy(policy: ExecutionPolicy): void {
  if (!Number.isSafeInteger(policy.timeoutMs) || policy.timeoutMs <= 0) {
    throw new AiCapabilityError("TIMEOUT");
  }
  if (policy.privacy === "sensitive" && policy.cache === "eligible") {
    throw new AiCapabilityError("INVALID_OUTPUT");
  }
  if (policy.signal?.aborted) throw new AiCapabilityError("CANCELLED");
}
