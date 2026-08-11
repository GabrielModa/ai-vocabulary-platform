export const LEARNING_ALGORITHM_VERSION = "lexi-spacing-v1" as const;

export type LearningAlgorithmVersion = typeof LEARNING_ALGORITHM_VERSION;
export type MasteryState = "new" | "learning" | "review" | "mastered";

export interface LearningEvent {
  readonly eventId: string;
  readonly knowledgeId: string;
  readonly occurredAt: string;
  readonly recordedAt: string;
  readonly activity: "multiple-choice-recognition";
  readonly correct: boolean;
  readonly hintsUsed: number;
  readonly contextId: string;
  readonly algorithmVersion: LearningAlgorithmVersion;
}

interface ProcessedLearningEvent {
  readonly eventId: string;
  readonly fingerprint: string;
}

export interface MasteryProjection {
  readonly knowledgeId: string;
  readonly state: MasteryState;
  readonly masteryScore: number;
  readonly stabilityDays: number;
  readonly difficulty: number;
  readonly successfulRetrievals: number;
  readonly lapses: number;
  readonly lastReviewedAt?: string;
  readonly nextReviewAt?: string;
  readonly sourceEventIds: readonly string[];
  readonly algorithmVersion: LearningAlgorithmVersion;
  readonly processedEvents: readonly ProcessedLearningEvent[];
}

export type LearningEngineErrorCode =
  | "INVALID_EVENT"
  | "INVALID_PROJECTION"
  | "UNSUPPORTED_VERSION"
  | "KNOWLEDGE_MISMATCH"
  | "CONFLICTING_EVENT";

export class LearningEngineError extends Error {
  constructor(readonly code: LearningEngineErrorCode) {
    super(`Learning engine failed: ${code}`);
    this.name = "LearningEngineError";
  }
}

const DAY_MS = 24 * 60 * 60 * 1_000;
const SUCCESS_INTERVALS_DAYS = Object.freeze([1, 3, 7, 14, 30, 60, 120, 180]);

function boundedIdentifier(value: string, maximum = 200): boolean {
  return value.trim().length > 0 && value.length <= maximum;
}

function validInstant(value: string): boolean {
  return value.length <= 40 && Number.isFinite(Date.parse(value));
}

function validateEvent(event: LearningEvent): void {
  const algorithmVersion: string = event.algorithmVersion;
  const activity: string = event.activity;
  if (algorithmVersion !== LEARNING_ALGORITHM_VERSION) {
    throw new LearningEngineError("UNSUPPORTED_VERSION");
  }
  if (
    !boundedIdentifier(event.eventId, 512) ||
    !boundedIdentifier(event.knowledgeId) ||
    !boundedIdentifier(event.contextId) ||
    !validInstant(event.occurredAt) ||
    !validInstant(event.recordedAt) ||
    activity !== "multiple-choice-recognition" ||
    typeof event.correct !== "boolean" ||
    !Number.isInteger(event.hintsUsed) ||
    event.hintsUsed < 0 ||
    event.hintsUsed > 10
  ) {
    throw new LearningEngineError("INVALID_EVENT");
  }
}

function eventFingerprint(event: LearningEvent): string {
  return JSON.stringify([
    event.eventId,
    event.knowledgeId,
    event.occurredAt,
    event.recordedAt,
    event.activity,
    event.correct,
    event.hintsUsed,
    event.contextId,
    event.algorithmVersion,
  ]);
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function addDays(instant: string, days: number): string {
  return new Date(Date.parse(instant) + days * DAY_MS).toISOString();
}

function freezeProjection(projection: MasteryProjection): MasteryProjection {
  Object.freeze(projection.sourceEventIds);
  for (const event of projection.processedEvents) Object.freeze(event);
  Object.freeze(projection.processedEvents);
  return Object.freeze(projection);
}

export function createMasteryProjection(knowledgeId: string): MasteryProjection {
  if (!boundedIdentifier(knowledgeId)) throw new LearningEngineError("INVALID_PROJECTION");
  return freezeProjection({
    knowledgeId: knowledgeId.trim(),
    state: "new",
    masteryScore: 0,
    stabilityDays: 0,
    difficulty: 5,
    successfulRetrievals: 0,
    lapses: 0,
    sourceEventIds: [],
    algorithmVersion: LEARNING_ALGORITHM_VERSION,
    processedEvents: [],
  });
}

function successfulStability(projection: MasteryProjection, event: LearningEvent): number {
  const successNumber = projection.successfulRetrievals + 1;
  const baseline =
    SUCCESS_INTERVALS_DAYS[Math.min(successNumber - 1, SUCCESS_INTERVALS_DAYS.length - 1)] ?? 180;
  if (!projection.lastReviewedAt || projection.stabilityDays === 0) return baseline;
  const elapsedDays = Math.max(
    0,
    (Date.parse(event.recordedAt) - Date.parse(projection.lastReviewedAt)) / DAY_MS,
  );
  const lateness = Math.max(0, elapsedDays / projection.stabilityDays - 1);
  const lateBonus = 1 + Math.min(lateness, 2) * 0.15;
  return rounded(Math.min(180, Math.max(baseline, baseline * lateBonus)));
}

function successfulState(successfulRetrievals: number, masteryScore: number): MasteryState {
  if (successfulRetrievals >= 5 && masteryScore >= 0.6) return "mastered";
  return successfulRetrievals >= 2 ? "review" : "learning";
}

export function applyLearningEvent(
  projection: MasteryProjection,
  event: LearningEvent,
): MasteryProjection {
  validateEvent(event);
  const projectionVersion: string = projection.algorithmVersion;
  if (projectionVersion !== LEARNING_ALGORITHM_VERSION) {
    throw new LearningEngineError("UNSUPPORTED_VERSION");
  }
  if (projection.knowledgeId !== event.knowledgeId) {
    throw new LearningEngineError("KNOWLEDGE_MISMATCH");
  }
  const fingerprint = eventFingerprint(event);
  const existing = projection.processedEvents.find(({ eventId }) => eventId === event.eventId);
  if (existing) {
    if (existing.fingerprint !== fingerprint) throw new LearningEngineError("CONFLICTING_EVENT");
    return projection;
  }

  const successfulRetrievals = projection.successfulRetrievals + (event.correct ? 1 : 0);
  const lapses = projection.lapses + (event.correct ? 0 : 1);
  const masteryScore = rounded(
    event.correct
      ? clamp(projection.masteryScore + 0.18, 0, 1)
      : clamp(projection.masteryScore - 0.25, 0, 1),
  );
  const stabilityDays = event.correct ? successfulStability(projection, event) : 0.25;
  const difficulty = rounded(
    event.correct
      ? clamp(projection.difficulty - 0.2, 1, 10)
      : clamp(projection.difficulty + 0.8, 1, 10),
  );
  const reviewIntervalDays = event.correct ? stabilityDays : 0.25;

  return freezeProjection({
    knowledgeId: projection.knowledgeId,
    state: event.correct
      ? successfulState(successfulRetrievals, masteryScore)
      : projection.successfulRetrievals === 0
        ? "learning"
        : "review",
    masteryScore,
    stabilityDays,
    difficulty,
    successfulRetrievals,
    lapses,
    lastReviewedAt: event.recordedAt,
    nextReviewAt: addDays(event.recordedAt, reviewIntervalDays),
    sourceEventIds: [...projection.sourceEventIds, event.eventId],
    algorithmVersion: LEARNING_ALGORITHM_VERSION,
    processedEvents: [...projection.processedEvents, { eventId: event.eventId, fingerprint }],
  });
}

export function replayLearningEvents(
  knowledgeId: string,
  events: readonly LearningEvent[],
): MasteryProjection {
  const ordered = [...events].sort((left, right) => {
    const byRecordedAt = Date.parse(left.recordedAt) - Date.parse(right.recordedAt);
    return byRecordedAt === 0 ? left.eventId.localeCompare(right.eventId, "en-US") : byRecordedAt;
  });
  return ordered.reduce(applyLearningEvent, createMasteryProjection(knowledgeId));
}
