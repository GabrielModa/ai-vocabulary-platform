export interface SessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ResumableCandidate {
  readonly candidateId?: string;
  readonly senseId?: string;
  readonly term: string;
  readonly meaning: string;
  readonly type: string;
  readonly example: string;
  readonly challenge: string;
  readonly contexts?: readonly string[];
  readonly exerciseKind?: "cloze" | "definition-choice";
  readonly exercisePipelineOutcome?: {
    readonly outcome: "publish";
    readonly pipeline: "verified-exercise-pipeline-v1";
    readonly semanticUniqueness: "not-proven";
    readonly exercise: {
      readonly exerciseId: string;
      readonly exerciseKind: "cloze";
      readonly candidateId: string;
      readonly senseId: string;
      readonly exampleId: string;
      readonly sourceSentence: string;
      readonly gapSentence: string;
      readonly answer: string;
      readonly options: readonly string[];
      readonly provenance: {
        readonly exampleProvider: string;
        readonly exampleSourceRecordId: string;
        readonly lexicalProvider: string;
        readonly lexicalSourceRecordId: string;
      };
    };
  };
}

export interface ResumableAttempt {
  readonly term: string;
  readonly chosenTerm: string;
  readonly correct: boolean;
  readonly voided?: boolean;
}

export interface InterruptedStudySession {
  readonly version: 1;
  readonly savedAt: string;
  readonly title: string;
  readonly level: "A2" | "B1" | "B2" | "C1" | "C2";
  readonly candidates: readonly ResumableCandidate[];
  readonly selectedTerms: readonly string[];
  readonly questionIndex: number;
  readonly chosenTerm?: string;
  readonly feedback?: "correct" | "incorrect";
  readonly attempts: readonly ResumableAttempt[];
}

const STORAGE_KEY = "lexi.interrupted-study-session.v1";
const MAX_SNAPSHOT_BYTES = 256_000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1_000;
const levels = new Set(["A2", "B1", "B2", "C1", "C2"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedString(value: unknown, maximum: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximum ? normalized : undefined;
}

export function resumableCandidateFrom(value: unknown): ResumableCandidate | undefined {
  if (!isRecord(value)) return undefined;
  const term = boundedString(value.term, 120);
  const meaning = boundedString(value.meaning, 1_000);
  const type = boundedString(value.type, 60);
  const example = boundedString(value.example, 1_000);
  const challenge = boundedString(value.challenge, 1_000);
  if (!term || !meaning || !type || !example || !challenge) return undefined;

  const contexts = Array.isArray(value.contexts)
    ? value.contexts
        .map((context) => boundedString(context, 1_000))
        .filter((context): context is string => Boolean(context))
        .slice(0, 3)
    : undefined;
  const candidateId = boundedString(value.candidateId, 200);
  const senseId = boundedString(value.senseId, 200);
  const exerciseKind =
    value.exerciseKind === "cloze" || value.exerciseKind === "definition-choice"
      ? value.exerciseKind
      : undefined;
  const exercisePipelineOutcome = publishedExerciseFrom(value.exercisePipelineOutcome);
  if (value.exercisePipelineOutcome !== undefined && !exercisePipelineOutcome) return undefined;

  return {
    term,
    meaning,
    type,
    example,
    challenge,
    ...(candidateId ? { candidateId } : {}),
    ...(senseId ? { senseId } : {}),
    ...(contexts && contexts.length > 0 ? { contexts: Object.freeze(contexts) } : {}),
    ...(exerciseKind ? { exerciseKind } : {}),
    ...(exercisePipelineOutcome ? { exercisePipelineOutcome } : {}),
  };
}

function publishedExerciseFrom(
  value: unknown,
): ResumableCandidate["exercisePipelineOutcome"] | undefined {
  if (!isRecord(value) || value.outcome !== "publish" || !isRecord(value.exercise)) {
    return undefined;
  }
  const exercise = value.exercise;
  const provenance = exercise.provenance;
  if (!isRecord(provenance) || !Array.isArray(exercise.options)) return undefined;
  const fields = {
    exerciseId: boundedString(exercise.exerciseId, 200),
    candidateId: boundedString(exercise.candidateId, 200),
    senseId: boundedString(exercise.senseId, 200),
    exampleId: boundedString(exercise.exampleId, 200),
    sourceSentence: boundedString(exercise.sourceSentence, 1_000),
    gapSentence: boundedString(exercise.gapSentence, 1_000),
    answer: boundedString(exercise.answer, 120),
    exampleProvider: boundedString(provenance.exampleProvider, 120),
    exampleSourceRecordId: boundedString(provenance.exampleSourceRecordId, 200),
    lexicalProvider: boundedString(provenance.lexicalProvider, 120),
    lexicalSourceRecordId: boundedString(provenance.lexicalSourceRecordId, 200),
  };
  const {
    exerciseId,
    candidateId,
    senseId,
    exampleId,
    sourceSentence,
    gapSentence,
    answer,
    exampleProvider,
    exampleSourceRecordId,
    lexicalProvider,
    lexicalSourceRecordId,
  } = fields;
  if (
    !exerciseId ||
    !candidateId ||
    !senseId ||
    !exampleId ||
    !sourceSentence ||
    !gapSentence ||
    !answer ||
    !exampleProvider ||
    !exampleSourceRecordId ||
    !lexicalProvider ||
    !lexicalSourceRecordId ||
    exercise.exerciseKind !== "cloze"
  ) {
    return undefined;
  }
  const options = exercise.options
    .map((option) => boundedString(option, 120))
    .filter((option): option is string => Boolean(option));
  if (options.length !== exercise.options.length || options.length !== 4) return undefined;
  return {
    outcome: "publish",
    pipeline: "verified-exercise-pipeline-v1",
    semanticUniqueness: "not-proven",
    exercise: {
      exerciseId,
      exerciseKind: "cloze",
      candidateId,
      senseId,
      exampleId,
      sourceSentence,
      gapSentence,
      answer,
      options: Object.freeze(options),
      provenance: {
        exampleProvider,
        exampleSourceRecordId,
        lexicalProvider,
        lexicalSourceRecordId,
      },
    },
  };
}

export function resumableAttemptFrom(
  value: unknown,
  terms: ReadonlySet<string>,
): ResumableAttempt | undefined {
  if (!isRecord(value)) return undefined;
  const term = boundedString(value.term, 120);
  const chosenTerm = boundedString(value.chosenTerm, 120);
  if (!term || !chosenTerm || !terms.has(term) || typeof value.correct !== "boolean") {
    return undefined;
  }
  return {
    term,
    chosenTerm,
    correct: value.correct,
    ...(value.voided === true ? { voided: true } : {}),
  };
}

function sessionFrom(value: unknown, now: Date): InterruptedStudySession | undefined {
  if (!isRecord(value) || value.version !== 1) return undefined;
  const savedAt = boundedString(value.savedAt, 40);
  const savedTime = savedAt ? Date.parse(savedAt) : Number.NaN;
  if (
    !savedAt ||
    !Number.isFinite(savedTime) ||
    savedTime < now.getTime() - MAX_AGE_MS ||
    savedTime > now.getTime() + MAX_CLOCK_SKEW_MS
  ) {
    return undefined;
  }
  const title = boundedString(value.title, 200);
  const level =
    typeof value.level === "string" && levels.has(value.level) ? value.level : undefined;
  if (!title || !level || !Array.isArray(value.candidates)) return undefined;
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
  const terms = new Set(safeCandidates.map(({ term }) => term));
  if (terms.size !== safeCandidates.length || !Array.isArray(value.selectedTerms)) return undefined;
  const selectedTerms = value.selectedTerms.filter(
    (term): term is string => typeof term === "string" && terms.has(term),
  );
  if (selectedTerms.length < 1 || selectedTerms.length !== value.selectedTerms.length) {
    return undefined;
  }
  if (
    !Number.isInteger(value.questionIndex) ||
    (value.questionIndex as number) < 0 ||
    (value.questionIndex as number) >= selectedTerms.length ||
    !Array.isArray(value.attempts)
  ) {
    return undefined;
  }
  const selected = new Set(selectedTerms);
  const attempts = value.attempts.map((attempt) => resumableAttemptFrom(attempt, selected));
  if (attempts.length > selectedTerms.length || attempts.some((attempt) => !attempt)) {
    return undefined;
  }
  const chosenTerm = boundedString(value.chosenTerm, 120);
  if (chosenTerm && !terms.has(chosenTerm)) return undefined;
  const feedback =
    value.feedback === "correct" || value.feedback === "incorrect" ? value.feedback : undefined;

  return {
    version: 1,
    savedAt,
    title,
    level: level as InterruptedStudySession["level"],
    candidates: Object.freeze(safeCandidates),
    selectedTerms: Object.freeze(selectedTerms),
    questionIndex: value.questionIndex as number,
    attempts: Object.freeze(
      attempts.filter((attempt): attempt is ResumableAttempt => Boolean(attempt)),
    ),
    ...(chosenTerm ? { chosenTerm } : {}),
    ...(feedback ? { feedback } : {}),
  };
}

export function saveInterruptedStudySession(
  storage: SessionStorage,
  session: InterruptedStudySession,
): void {
  try {
    const serialized = JSON.stringify(session);
    if (serialized.length <= MAX_SNAPSHOT_BYTES) storage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Persistence is optional and must never interrupt practice.
  }
}

export function clearInterruptedStudySession(storage: SessionStorage): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable or blocked without affecting practice.
  }
}

export function readInterruptedStudySession(
  storage: SessionStorage,
  now = new Date(),
): InterruptedStudySession | undefined {
  try {
    const serialized = storage.getItem(STORAGE_KEY);
    if (!serialized) return undefined;
    if (serialized.length > MAX_SNAPSHOT_BYTES) {
      clearInterruptedStudySession(storage);
      return undefined;
    }
    const session = sessionFrom(JSON.parse(serialized) as unknown, now);
    if (!session) clearInterruptedStudySession(storage);
    return session;
  } catch {
    clearInterruptedStudySession(storage);
    return undefined;
  }
}
