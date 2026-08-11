import {
  resumableAttemptFrom,
  resumableCandidateFrom,
  type ResumableAttempt,
  type ResumableCandidate,
} from "./interrupted-study-session";

export interface StudyHistoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface CompletedStudySession {
  readonly version: 1;
  readonly sessionId: string;
  readonly completedAt: string;
  readonly title: string;
  readonly level: "A2" | "B1" | "B2" | "C1" | "C2";
  readonly candidates: readonly ResumableCandidate[];
  readonly selectedTerms: readonly string[];
  readonly attempts: readonly ResumableAttempt[];
  readonly score: {
    readonly correct: number;
    readonly attempted: number;
    readonly percentage: number;
  };
}

const STORAGE_KEY = "lexi.completed-study-sessions";
const HISTORY_VERSION = 1;
const MAX_HISTORY_BYTES = 1_000_000;
const MAX_SESSIONS = 50;
const levels = new Set(["A2", "B1", "B2", "C1", "C2"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedString(value: unknown, maximum: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximum ? normalized : undefined;
}

function deepFreeze(value: unknown): void {
  if (typeof value !== "object" || value === null) return;
  for (const child of Object.values(value)) deepFreeze(child);
  if (!Object.isFrozen(value)) Object.freeze(value);
}

function completedSessionFrom(value: unknown): CompletedStudySession | undefined {
  if (!isRecord(value) || value.version !== 1) return undefined;
  const sessionId = boundedString(value.sessionId, 200);
  const completedAt = boundedString(value.completedAt, 40);
  const completedTime = completedAt ? Date.parse(completedAt) : Number.NaN;
  const title = boundedString(value.title, 200);
  const level =
    typeof value.level === "string" && levels.has(value.level) ? value.level : undefined;
  if (
    !sessionId ||
    !completedAt ||
    !Number.isFinite(completedTime) ||
    !title ||
    !level ||
    !Array.isArray(value.candidates) ||
    !Array.isArray(value.selectedTerms) ||
    !Array.isArray(value.attempts) ||
    !isRecord(value.score)
  ) {
    return undefined;
  }

  const candidates = value.candidates.map(resumableCandidateFrom);
  if (
    candidates.length === 0 ||
    candidates.length > 50 ||
    candidates.some((candidate) => !candidate)
  ) {
    return undefined;
  }
  const safeCandidates = candidates.filter((candidate): candidate is ResumableCandidate =>
    Boolean(candidate),
  );
  const candidateTerms = new Set(safeCandidates.map(({ term }) => term));
  if (candidateTerms.size !== safeCandidates.length) return undefined;

  const selectedTerms = value.selectedTerms.filter(
    (term): term is string => typeof term === "string" && candidateTerms.has(term),
  );
  if (
    selectedTerms.length === 0 ||
    selectedTerms.length !== value.selectedTerms.length ||
    new Set(selectedTerms).size !== selectedTerms.length
  ) {
    return undefined;
  }
  const selected = new Set(selectedTerms);
  const attempts = value.attempts.map((attempt) => resumableAttemptFrom(attempt, selected));
  if (attempts.length > selectedTerms.length || attempts.some((attempt) => !attempt)) {
    return undefined;
  }
  const safeAttempts = attempts.filter((attempt): attempt is ResumableAttempt => Boolean(attempt));
  if (new Set(safeAttempts.map(({ term }) => term)).size !== safeAttempts.length) return undefined;

  const scorable = safeAttempts.filter(({ voided }) => !voided);
  const correct = scorable.filter((attempt) => attempt.correct).length;
  const attempted = scorable.length;
  const percentage = attempted === 0 ? 0 : Math.round((correct / attempted) * 100);
  if (
    value.score.correct !== correct ||
    value.score.attempted !== attempted ||
    value.score.percentage !== percentage
  ) {
    return undefined;
  }

  const session: CompletedStudySession = {
    version: 1,
    sessionId,
    completedAt,
    title,
    level: level as CompletedStudySession["level"],
    candidates: Object.freeze(safeCandidates),
    selectedTerms: Object.freeze(selectedTerms),
    attempts: Object.freeze(safeAttempts),
    score: Object.freeze({ correct, attempted, percentage }),
  };
  deepFreeze(session);
  return session;
}

function removeInvalidHistory(storage: StudyHistoryStorage): readonly CompletedStudySession[] {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Local history is optional and must never interrupt learning.
  }
  return Object.freeze([]);
}

export function readCompletedStudySessions(
  storage: StudyHistoryStorage,
): readonly CompletedStudySession[] {
  try {
    const serialized = storage.getItem(STORAGE_KEY);
    if (!serialized) return Object.freeze([]);
    if (serialized.length > MAX_HISTORY_BYTES) return removeInvalidHistory(storage);
    const envelope: unknown = JSON.parse(serialized);
    if (
      !isRecord(envelope) ||
      envelope.version !== HISTORY_VERSION ||
      !Array.isArray(envelope.sessions)
    ) {
      return removeInvalidHistory(storage);
    }
    const sessions = envelope.sessions.map(completedSessionFrom);
    if (sessions.length > MAX_SESSIONS || sessions.some((session) => !session)) {
      return removeInvalidHistory(storage);
    }
    return Object.freeze(
      sessions.filter((session): session is CompletedStudySession => Boolean(session)),
    );
  } catch {
    return removeInvalidHistory(storage);
  }
}

export function appendCompletedStudySession(
  storage: StudyHistoryStorage,
  session: CompletedStudySession,
): void {
  try {
    const safeSession = completedSessionFrom(session);
    if (!safeSession) return;
    const current = readCompletedStudySessions(storage);
    if (current.some(({ sessionId }) => sessionId === safeSession.sessionId)) return;
    const sessions = [safeSession, ...current]
      .sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt))
      .slice(0, MAX_SESSIONS);
    let serialized = JSON.stringify({ version: HISTORY_VERSION, sessions });
    while (serialized.length > MAX_HISTORY_BYTES && sessions.length > 0) {
      sessions.pop();
      serialized = JSON.stringify({ version: HISTORY_VERSION, sessions });
    }
    if (sessions.length > 0) storage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Storage can be unavailable without affecting practice.
  }
}
