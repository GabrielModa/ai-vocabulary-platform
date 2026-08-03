import type { LearningCandidate } from "./candidate-pipeline.js";

export type LearningArtifactType = "exercise" | "image";
export type LearningArtifactStatus =
  "pending" | "generating" | "ready" | "stale" | "invalid" | "failed";

export interface LearningArtifactSource {
  readonly kind: "deterministic" | "generated" | "provider";
  readonly provider?: string;
  readonly model?: string;
  readonly promptVersion?: string;
  readonly sourceRecordId?: string;
}

interface LearningArtifactBase {
  readonly artifactId: string;
  readonly candidateId: string;
  readonly senseId: string;
  readonly sourceDefinition: string;
  readonly type: LearningArtifactType;
  readonly status: LearningArtifactStatus;
  readonly version: number;
  readonly source: LearningArtifactSource;
  readonly createdAt: string;
  readonly invalidationReason?: string;
}

export interface ExerciseArtifact extends LearningArtifactBase {
  readonly type: "exercise";
  readonly exerciseKind: "definition-choice" | "cloze";
  readonly prompt: string;
  readonly answer: string;
  readonly options: readonly string[];
}

export interface ImageArtifact extends LearningArtifactBase {
  readonly type: "image";
  readonly imageJobId?: string;
  readonly imagePath?: string;
  readonly semanticContext: string;
}

export type LearningArtifact = ExerciseArtifact | ImageArtifact;

export interface ArtifactIdentity {
  readonly candidateId: string;
  readonly senseId: string;
  readonly sourceDefinition: string;
}

function requireSelectedSense(candidate: LearningCandidate): ArtifactIdentity {
  const selectedSense = candidate.selectedSense;
  if (!selectedSense) {
    throw new Error("Learning artifacts require a selected lexical sense");
  }
  return {
    candidateId: candidate.candidateId,
    senseId: selectedSense.senseId,
    sourceDefinition: selectedSense.definition,
  };
}

function artifactId(
  identity: ArtifactIdentity,
  type: LearningArtifactType,
  version: number,
): string {
  return [
    "artifact",
    encodeURIComponent(identity.candidateId),
    encodeURIComponent(identity.senseId),
    type,
    String(version),
  ].join(":");
}

function validateVersion(version: number): void {
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error("Artifact version must be a positive safe integer");
  }
}

function validateTimestamp(createdAt: string): void {
  if (Number.isNaN(Date.parse(createdAt))) {
    throw new Error("Artifact createdAt must be an ISO-compatible timestamp");
  }
}

export interface CreateExerciseArtifactInput {
  readonly candidate: LearningCandidate;
  readonly exerciseKind: ExerciseArtifact["exerciseKind"];
  readonly prompt: string;
  readonly answer: string;
  readonly options: readonly string[];
  readonly source: LearningArtifactSource;
  readonly createdAt: string;
  readonly version?: number;
  readonly status?: LearningArtifactStatus;
}

export function createExerciseArtifact(input: CreateExerciseArtifactInput): ExerciseArtifact {
  const identity = requireSelectedSense(input.candidate);
  const version = input.version ?? 1;
  validateVersion(version);
  validateTimestamp(input.createdAt);
  if (!input.prompt.trim()) throw new Error("Exercise prompt is required");
  if (!input.answer.trim()) throw new Error("Exercise answer is required");

  const normalizedOptions = input.options.map((option) => option.trim()).filter(Boolean);
  if (!normalizedOptions.includes(input.answer.trim())) {
    throw new Error("Exercise options must contain the answer");
  }

  return {
    ...identity,
    artifactId: artifactId(identity, "exercise", version),
    type: "exercise",
    status: input.status ?? "ready",
    version,
    source: input.source,
    createdAt: input.createdAt,
    exerciseKind: input.exerciseKind,
    prompt: input.prompt.trim(),
    answer: input.answer.trim(),
    options: normalizedOptions,
  };
}

export interface CreateImageArtifactInput {
  readonly candidate: LearningCandidate;
  readonly semanticContext: string;
  readonly source: LearningArtifactSource;
  readonly createdAt: string;
  readonly imageJobId?: string;
  readonly imagePath?: string;
  readonly version?: number;
  readonly status?: LearningArtifactStatus;
}

export function createImageArtifact(input: CreateImageArtifactInput): ImageArtifact {
  const identity = requireSelectedSense(input.candidate);
  const version = input.version ?? 1;
  validateVersion(version);
  validateTimestamp(input.createdAt);
  if (!input.semanticContext.trim()) throw new Error("Image semantic context is required");

  return {
    ...identity,
    artifactId: artifactId(identity, "image", version),
    type: "image",
    status: input.status ?? "pending",
    version,
    source: input.source,
    createdAt: input.createdAt,
    semanticContext: input.semanticContext.trim(),
    ...(input.imageJobId ? { imageJobId: input.imageJobId } : {}),
    ...(input.imagePath ? { imagePath: input.imagePath } : {}),
  };
}

export function isArtifactStale(artifact: LearningArtifact, candidate: LearningCandidate): boolean {
  const selectedSense = candidate.selectedSense;
  if (!selectedSense) return true;
  return (
    artifact.candidateId !== candidate.candidateId ||
    artifact.senseId !== selectedSense.senseId ||
    artifact.sourceDefinition !== selectedSense.definition
  );
}

export function markArtifactStale(
  artifact: LearningArtifact,
  reason = "source-sense-changed",
): LearningArtifact {
  return { ...artifact, status: "stale", invalidationReason: reason };
}

export function invalidateArtifact(artifact: LearningArtifact, reason: string): LearningArtifact {
  const normalizedReason = reason.trim();
  if (!normalizedReason) throw new Error("Artifact invalidation reason is required");
  return { ...artifact, status: "invalid", invalidationReason: normalizedReason };
}
