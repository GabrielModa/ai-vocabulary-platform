import type {
  TextGenerationCapability,
  TextGenerationOutput,
  TextGenerationRequest,
} from "./capabilities.js";
import {
  AiCapabilityError,
  assertExecutionPolicy,
  type AiResult,
  type Provenance,
} from "./execution.js";

export interface DeterministicTextFakeOptions {
  readonly output: TextGenerationOutput;
  readonly uncertainty?: number;
  readonly provider?: string;
}

export class DeterministicTextGenerationFake implements TextGenerationCapability {
  readonly requests: TextGenerationRequest[] = [];

  constructor(private readonly options: DeterministicTextFakeOptions) {}

  generate(request: TextGenerationRequest): Promise<AiResult<TextGenerationOutput>> {
    assertExecutionPolicy(request.policy);
    this.requests.push(structuredClone(request));
    const provenance: Provenance = {
      provider: this.options.provider ?? "deterministic-fake",
      capability: "text-generation",
      versions: request.versions,
      generatedAt: "2026-01-01T00:00:00.000Z",
    };
    if (request.policy.signal?.aborted) return Promise.reject(new AiCapabilityError("CANCELLED"));
    return Promise.resolve({
      value: structuredClone(this.options.output),
      uncertainty: this.options.uncertainty ?? 0,
      usage: { inputUnits: request.input.length, outputUnits: 1, unit: "characters" },
      provenance,
    });
  }
}
