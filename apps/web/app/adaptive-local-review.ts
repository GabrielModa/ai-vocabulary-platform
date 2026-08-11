import {
  LEARNING_ALGORITHM_VERSION,
  createMasteryProjection,
  planAdaptiveSession,
  replayLearningEvents,
  type AdaptiveSelectionReason,
  type LearningEvent,
  type MasteryProjection,
} from "@vocabulary/domain-vocabulary";
import type { ResumableCandidate } from "./interrupted-study-session";
import type { CompletedStudySession } from "./local-study-history";

export interface LocalLearningProfileItem {
  readonly knowledgeId: string;
  readonly candidate: ResumableCandidate;
  readonly projection: MasteryProjection;
}

export interface LocalAdaptiveReviewItem extends LocalLearningProfileItem {
  readonly reason: AdaptiveSelectionReason;
  readonly position: number;
}

export interface LocalAdaptiveReviewPlan {
  readonly items: readonly LocalAdaptiveReviewItem[];
  readonly candidatePool: readonly ResumableCandidate[];
  readonly counts: { readonly due: number; readonly new: number; readonly early: number };
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

export function localKnowledgeId(candidate: ResumableCandidate): string {
  return candidate.senseId
    ? `sense:${candidate.senseId}`.slice(0, 200)
    : `term:${normalize(candidate.term)}:${normalize(candidate.type)}`.slice(0, 200);
}

function eventId(sessionId: string, knowledgeId: string): string {
  return `${sessionId}:${knowledgeId}`;
}

export function buildLocalLearningProfile(
  sessions: readonly CompletedStudySession[],
): readonly LocalLearningProfileItem[] {
  const ordered = [...sessions].sort(
    (left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt),
  );
  const candidates = new Map<string, ResumableCandidate>();
  const candidateTerms = new Set<string>();
  const events = new Map<string, LearningEvent[]>();

  for (const session of ordered) {
    const selected = new Set(session.selectedTerms);
    for (const candidate of session.candidates) {
      if (!selected.has(candidate.term)) continue;
      const knowledgeId = localKnowledgeId(candidate);
      const normalizedTerm = normalize(candidate.term);
      if (!candidates.has(knowledgeId) && !candidateTerms.has(normalizedTerm)) {
        candidates.set(knowledgeId, candidate);
        candidateTerms.add(normalizedTerm);
      }
      const attempt = session.attempts.find(({ term }) => term === candidate.term);
      if (!attempt || attempt.voided) continue;
      const learningEvent: LearningEvent = {
        eventId: eventId(session.sessionId, knowledgeId),
        knowledgeId,
        occurredAt: session.completedAt,
        recordedAt: session.completedAt,
        activity: "multiple-choice-recognition",
        correct: attempt.correct,
        hintsUsed: 0,
        contextId: (candidate.candidateId ?? `context:${knowledgeId}`).slice(0, 200),
        algorithmVersion: LEARNING_ALGORITHM_VERSION,
      };
      const existing = events.get(knowledgeId) ?? [];
      existing.push(learningEvent);
      events.set(knowledgeId, existing);
    }
  }

  const profile = [...candidates.entries()]
    .map(([knowledgeId, candidate]) =>
      Object.freeze({
        knowledgeId,
        candidate,
        projection: events.get(knowledgeId)?.length
          ? replayLearningEvents(knowledgeId, events.get(knowledgeId) ?? [])
          : createMasteryProjection(knowledgeId),
      }),
    )
    .sort((left, right) => left.knowledgeId.localeCompare(right.knowledgeId, "en-US"));
  return Object.freeze(profile);
}

export function planLocalAdaptiveReview(
  sessions: readonly CompletedStudySession[],
  now: string,
  sessionSize: number,
): LocalAdaptiveReviewPlan | undefined {
  if (sessions.length === 0) return undefined;
  const profile = buildLocalLearningProfile(sessions);
  if (profile.length === 0) return undefined;
  const boundedSessionSize = Math.min(sessionSize, profile.length);
  const plan = planAdaptiveSession(
    profile.map(({ knowledgeId, projection }) => ({ knowledgeId, projection })),
    { now, sessionSize: boundedSessionSize, maxNewItems: Math.min(3, boundedSessionSize) },
  );
  if (plan.items.length === 0) return undefined;
  const byKnowledge = new Map(profile.map((item) => [item.knowledgeId, item]));
  const items = plan.items.map((planned) => {
    const profileItem = byKnowledge.get(planned.knowledgeId);
    if (!profileItem) throw new Error("Adaptive plan referenced an unknown local candidate.");
    return Object.freeze({ ...profileItem, reason: planned.reason, position: planned.position });
  });
  return Object.freeze({
    items: Object.freeze(items),
    candidatePool: Object.freeze(profile.map(({ candidate }) => candidate)),
    counts: plan.counts,
  });
}
