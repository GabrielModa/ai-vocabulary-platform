import { describe, expect, it } from "vitest";
import {
  AdaptiveSessionPlannerError,
  planAdaptiveSession,
  type AdaptiveSessionCandidate,
} from "./adaptive-session-planner.js";
import { createMasteryProjection, type MasteryProjection } from "./learning-engine.js";

function projection(knowledgeId: string, overrides: Partial<MasteryProjection>): MasteryProjection {
  return Object.freeze({ ...createMasteryProjection(knowledgeId), ...overrides });
}

function candidate(
  knowledgeId: string,
  overrides: Partial<MasteryProjection> = {},
): AdaptiveSessionCandidate {
  return {
    knowledgeId,
    ...(Object.keys(overrides).length === 0
      ? {}
      : { projection: projection(knowledgeId, overrides) }),
  };
}

const now = "2026-08-20T12:00:00.000Z";

describe("adaptive session planner", () => {
  it("prioritizes due lapses before other due reviews", () => {
    const plan = planAdaptiveSession(
      [
        candidate("steady", {
          state: "review",
          masteryScore: 0.5,
          nextReviewAt: "2026-08-19T12:00:00.000Z",
          lapses: 0,
        }),
        candidate("lapsed", {
          state: "review",
          masteryScore: 0.3,
          nextReviewAt: "2026-08-20T10:00:00.000Z",
          lapses: 2,
        }),
      ],
      { now, sessionSize: 2, maxNewItems: 0 },
    );
    expect(plan.items.map(({ knowledgeId, reason }) => [knowledgeId, reason])).toEqual([
      ["lapsed", "lapsed-due"],
      ["steady", "due-review"],
    ]);
  });

  it("caps and interleaves new material with due review", () => {
    const plan = planAdaptiveSession(
      [
        candidate("due-a", {
          state: "review",
          nextReviewAt: "2026-08-18T12:00:00.000Z",
        }),
        candidate("due-b", {
          state: "learning",
          nextReviewAt: "2026-08-19T12:00:00.000Z",
        }),
        candidate("new-a"),
        candidate("new-b"),
        candidate("new-c"),
      ],
      { now, sessionSize: 4, maxNewItems: 2 },
    );
    expect(plan.items.map(({ knowledgeId }) => knowledgeId)).toEqual([
      "due-a",
      "new-a",
      "due-b",
      "new-b",
    ]);
    expect(plan.counts).toEqual({ due: 2, new: 2, early: 0 });
  });

  it("uses weak future reviews to fill capacity but excludes future mastery", () => {
    const plan = planAdaptiveSession(
      [
        candidate("weak-future", {
          state: "learning",
          masteryScore: 0.2,
          nextReviewAt: "2026-08-21T12:00:00.000Z",
        }),
        candidate("mastered-future", {
          state: "mastered",
          masteryScore: 0.9,
          nextReviewAt: "2026-09-20T12:00:00.000Z",
        }),
      ],
      { now, sessionSize: 3, maxNewItems: 0 },
    );
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]).toMatchObject({ knowledgeId: "weak-future", reason: "early-review" });
  });

  it("is deterministic regardless of candidate ingestion order", () => {
    const candidates = [candidate("new-b"), candidate("new-a"), candidate("new-c")];
    expect(planAdaptiveSession(candidates, { now, sessionSize: 2, maxNewItems: 2 })).toEqual(
      planAdaptiveSession([...candidates].reverse(), {
        now,
        sessionSize: 2,
        maxNewItems: 2,
      }),
    );
  });

  it("returns frozen plans and rejects invalid or duplicate input", () => {
    const plan = planAdaptiveSession([candidate("new-a")], {
      now,
      sessionSize: 1,
      maxNewItems: 1,
    });
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.items)).toBe(true);
    expect(Object.isFrozen(plan.items[0])).toBe(true);
    expect(() => planAdaptiveSession([], { now, sessionSize: 1, maxNewItems: 1 })).toThrowError(
      new AdaptiveSessionPlannerError("EMPTY_POOL"),
    );
    expect(() =>
      planAdaptiveSession([candidate("same"), candidate("same")], {
        now,
        sessionSize: 1,
        maxNewItems: 1,
      }),
    ).toThrowError(new AdaptiveSessionPlannerError("DUPLICATE_CANDIDATE"));
    expect(() =>
      planAdaptiveSession([candidate("new-a")], {
        now: "invalid",
        sessionSize: 1,
        maxNewItems: 1,
      }),
    ).toThrowError(new AdaptiveSessionPlannerError("INVALID_POLICY"));
  });
});
