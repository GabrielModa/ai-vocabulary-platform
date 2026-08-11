import { LEARNING_ALGORITHM_VERSION, type MasteryProjection } from "./learning-engine.js";

export interface AdaptiveSessionCandidate {
  readonly knowledgeId: string;
  readonly projection?: MasteryProjection;
}

export interface AdaptiveSessionPolicy {
  readonly now: string;
  readonly sessionSize: number;
  readonly maxNewItems: number;
}

export type AdaptiveSelectionReason = "lapsed-due" | "due-review" | "new" | "early-review";

export interface AdaptiveSessionItem {
  readonly knowledgeId: string;
  readonly reason: AdaptiveSelectionReason;
  readonly position: number;
}

export interface AdaptiveSessionPlan {
  readonly algorithmVersion: "adaptive-session-v1";
  readonly plannedAt: string;
  readonly items: readonly AdaptiveSessionItem[];
  readonly counts: {
    readonly due: number;
    readonly new: number;
    readonly early: number;
  };
}

export type AdaptiveSessionPlannerErrorCode =
  | "EMPTY_POOL"
  | "DUPLICATE_CANDIDATE"
  | "INVALID_CANDIDATE"
  | "INVALID_POLICY"
  | "UNSUPPORTED_PROJECTION";

export class AdaptiveSessionPlannerError extends Error {
  constructor(readonly code: AdaptiveSessionPlannerErrorCode) {
    super(`Adaptive session planning failed: ${code}`);
    this.name = "AdaptiveSessionPlannerError";
  }
}

interface RankedItem {
  readonly knowledgeId: string;
  readonly reason: AdaptiveSelectionReason;
  readonly masteryScore: number;
  readonly nextReviewAt?: string;
}

function validate(
  candidates: readonly AdaptiveSessionCandidate[],
  policy: AdaptiveSessionPolicy,
): void {
  if (candidates.length === 0) throw new AdaptiveSessionPlannerError("EMPTY_POOL");
  if (
    !Number.isFinite(Date.parse(policy.now)) ||
    !Number.isInteger(policy.sessionSize) ||
    policy.sessionSize < 1 ||
    policy.sessionSize > 50 ||
    !Number.isInteger(policy.maxNewItems) ||
    policy.maxNewItems < 0 ||
    policy.maxNewItems > policy.sessionSize
  ) {
    throw new AdaptiveSessionPlannerError("INVALID_POLICY");
  }
  const identifiers = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate.knowledgeId.trim() || candidate.knowledgeId.length > 200) {
      throw new AdaptiveSessionPlannerError("INVALID_CANDIDATE");
    }
    if (identifiers.has(candidate.knowledgeId)) {
      throw new AdaptiveSessionPlannerError("DUPLICATE_CANDIDATE");
    }
    identifiers.add(candidate.knowledgeId);
    if (candidate.projection) {
      const version: string = candidate.projection.algorithmVersion;
      if (version !== LEARNING_ALGORITHM_VERSION) {
        throw new AdaptiveSessionPlannerError("UNSUPPORTED_PROJECTION");
      }
      if (candidate.projection.knowledgeId !== candidate.knowledgeId) {
        throw new AdaptiveSessionPlannerError("INVALID_CANDIDATE");
      }
    }
  }
}

function compareDue(left: RankedItem, right: RankedItem): number {
  const time = Date.parse(left.nextReviewAt ?? "") - Date.parse(right.nextReviewAt ?? "");
  if (time !== 0) return time;
  if (left.masteryScore !== right.masteryScore) return left.masteryScore - right.masteryScore;
  return left.knowledgeId.localeCompare(right.knowledgeId, "en-US");
}

function compareEarly(left: RankedItem, right: RankedItem): number {
  if (left.masteryScore !== right.masteryScore) return left.masteryScore - right.masteryScore;
  const time = Date.parse(left.nextReviewAt ?? "") - Date.parse(right.nextReviewAt ?? "");
  if (time !== 0) return time;
  return left.knowledgeId.localeCompare(right.knowledgeId, "en-US");
}

function interleave(review: readonly RankedItem[], fresh: readonly RankedItem[]): RankedItem[] {
  const result: RankedItem[] = [];
  const maximum = Math.max(review.length, fresh.length);
  for (let index = 0; index < maximum; index += 1) {
    const reviewItem = review[index];
    const newItem = fresh[index];
    if (reviewItem) result.push(reviewItem);
    if (newItem) result.push(newItem);
  }
  return result;
}

export function planAdaptiveSession(
  candidates: readonly AdaptiveSessionCandidate[],
  policy: AdaptiveSessionPolicy,
): AdaptiveSessionPlan {
  validate(candidates, policy);
  const now = Date.parse(policy.now);
  const newItems: RankedItem[] = [];
  const lapsedDue: RankedItem[] = [];
  const otherDue: RankedItem[] = [];
  const early: RankedItem[] = [];

  for (const candidate of candidates) {
    const projection = candidate.projection;
    if (!projection || projection.state === "new") {
      newItems.push({ knowledgeId: candidate.knowledgeId, reason: "new", masteryScore: 0 });
      continue;
    }
    const due = projection.nextReviewAt && Date.parse(projection.nextReviewAt) <= now;
    const item: RankedItem = {
      knowledgeId: candidate.knowledgeId,
      reason: due ? (projection.lapses > 0 ? "lapsed-due" : "due-review") : "early-review",
      masteryScore: projection.masteryScore,
      ...(projection.nextReviewAt ? { nextReviewAt: projection.nextReviewAt } : {}),
    };
    if (due && projection.lapses > 0) lapsedDue.push(item);
    else if (due) otherDue.push(item);
    else if (projection.state !== "mastered") early.push(item);
  }

  newItems.sort((left, right) => left.knowledgeId.localeCompare(right.knowledgeId, "en-US"));
  lapsedDue.sort(compareDue);
  otherDue.sort(compareDue);
  early.sort(compareEarly);
  const dueItems = [...lapsedDue, ...otherDue];
  const newLimit = Math.min(
    policy.maxNewItems,
    newItems.length,
    dueItems.length > 0 ? Math.floor(policy.sessionSize / 2) : policy.sessionSize,
  );
  const selectedNew = newItems.slice(0, newLimit);
  const selectedDue = dueItems.slice(0, policy.sessionSize - selectedNew.length);
  const selected = interleave(selectedDue, selectedNew);
  const remaining = policy.sessionSize - selected.length;
  if (remaining > 0) selected.push(...early.slice(0, remaining));

  const items = selected.map((item, index) =>
    Object.freeze({ knowledgeId: item.knowledgeId, reason: item.reason, position: index + 1 }),
  );
  const counts = Object.freeze({
    due: items.filter(({ reason }) => reason === "lapsed-due" || reason === "due-review").length,
    new: items.filter(({ reason }) => reason === "new").length,
    early: items.filter(({ reason }) => reason === "early-review").length,
  });
  return Object.freeze({
    algorithmVersion: "adaptive-session-v1",
    plannedAt: new Date(now).toISOString(),
    items: Object.freeze(items),
    counts,
  });
}
