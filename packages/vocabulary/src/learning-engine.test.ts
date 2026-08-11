import { describe, expect, it } from "vitest";
import {
  LearningEngineError,
  applyLearningEvent,
  createMasteryProjection,
  replayLearningEvents,
  type LearningEvent,
} from "./learning-engine.js";

function event(overrides: Partial<LearningEvent> = {}): LearningEvent {
  return {
    eventId: "event-1",
    knowledgeId: "knowledge:pitch:noun:field",
    occurredAt: "2026-08-11T10:00:00.000Z",
    recordedAt: "2026-08-11T10:00:01.000Z",
    activity: "multiple-choice-recognition",
    correct: true,
    hintsUsed: 0,
    contextId: "context:match",
    algorithmVersion: "lexi-spacing-v1",
    ...overrides,
  };
}

describe("versioned learning engine", () => {
  it("creates new state without pretending exposure is mastery", () => {
    const projection = createMasteryProjection("knowledge:pitch:noun:field");
    expect(projection).toMatchObject({
      state: "new",
      masteryScore: 0,
      successfulRetrievals: 0,
      lapses: 0,
      algorithmVersion: "lexi-spacing-v1",
    });
    expect(projection.nextReviewAt).toBeUndefined();
    expect(Object.isFrozen(projection)).toBe(true);
  });

  it("schedules first correct recognition without marking mastery", () => {
    const projection = applyLearningEvent(
      createMasteryProjection("knowledge:pitch:noun:field"),
      event(),
    );
    expect(projection).toMatchObject({
      state: "learning",
      successfulRetrievals: 1,
      lapses: 0,
      stabilityDays: 1,
      masteryScore: 0.18,
      nextReviewAt: "2026-08-12T10:00:01.000Z",
    });
  });

  it("grows spacing across delayed successful retrievals and eventually marks review mastery", () => {
    const events = [
      event(),
      event({
        eventId: "event-2",
        occurredAt: "2026-08-12T10:00:00.000Z",
        recordedAt: "2026-08-12T10:00:01.000Z",
      }),
      event({
        eventId: "event-3",
        occurredAt: "2026-08-15T10:00:00.000Z",
        recordedAt: "2026-08-15T10:00:01.000Z",
      }),
      event({
        eventId: "event-4",
        occurredAt: "2026-08-22T10:00:00.000Z",
        recordedAt: "2026-08-22T10:00:01.000Z",
      }),
      event({
        eventId: "event-5",
        occurredAt: "2026-09-05T10:00:00.000Z",
        recordedAt: "2026-09-05T10:00:01.000Z",
      }),
    ];
    const projection = replayLearningEvents("knowledge:pitch:noun:field", events);
    expect(projection.state).toBe("mastered");
    expect(projection.successfulRetrievals).toBe(5);
    expect(projection.stabilityDays).toBeGreaterThanOrEqual(28);
    expect(projection.masteryScore).toBeGreaterThanOrEqual(0.6);
  });

  it("records a lapse and schedules it earlier than the prior interval", () => {
    const learned = replayLearningEvents("knowledge:pitch:noun:field", [
      event(),
      event({
        eventId: "event-2",
        occurredAt: "2026-08-12T10:00:00.000Z",
        recordedAt: "2026-08-12T10:00:01.000Z",
      }),
    ]);
    const lapsed = applyLearningEvent(
      learned,
      event({
        eventId: "event-3",
        correct: false,
        occurredAt: "2026-08-15T10:00:00.000Z",
        recordedAt: "2026-08-15T10:00:01.000Z",
      }),
    );
    expect(lapsed.state).toBe("review");
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.stabilityDays).toBeLessThan(learned.stabilityDays);
    expect(Date.parse(lapsed.nextReviewAt ?? "")).toBe(Date.parse("2026-08-15T16:00:01.000Z"));
  });

  it("does not punish a successful late review", () => {
    const first = applyLearningEvent(
      createMasteryProjection("knowledge:pitch:noun:field"),
      event(),
    );
    const late = applyLearningEvent(
      first,
      event({
        eventId: "event-late",
        occurredAt: "2026-08-20T10:00:00.000Z",
        recordedAt: "2026-08-20T10:00:01.000Z",
      }),
    );
    expect(late.masteryScore).toBeGreaterThan(first.masteryScore);
    expect(late.stabilityDays).toBeGreaterThan(first.stabilityDays);
    expect(late.difficulty).toBeLessThanOrEqual(first.difficulty);
  });

  it("is idempotent for the same event and rejects a conflicting duplicate", () => {
    const first = applyLearningEvent(
      createMasteryProjection("knowledge:pitch:noun:field"),
      event(),
    );
    expect(applyLearningEvent(first, event())).toBe(first);
    expect(() => applyLearningEvent(first, event({ correct: false }))).toThrowError(
      new LearningEngineError("CONFLICTING_EVENT"),
    );
  });

  it("replays deterministically by authoritative record time", () => {
    const earlier = event({ eventId: "event-a", correct: false });
    const later = event({
      eventId: "event-b",
      recordedAt: "2026-08-11T11:00:00.000Z",
      occurredAt: "2026-08-11T10:59:00.000Z",
    });
    expect(replayLearningEvents(earlier.knowledgeId, [later, earlier])).toEqual(
      replayLearningEvents(earlier.knowledgeId, [earlier, later]),
    );
  });

  it("rejects invalid versions, instants, and cross-word evidence", () => {
    const projection = createMasteryProjection("knowledge:pitch:noun:field");
    expect(() =>
      applyLearningEvent(projection, event({ algorithmVersion: "future-version" as never })),
    ).toThrowError(new LearningEngineError("UNSUPPORTED_VERSION"));
    expect(() => applyLearningEvent(projection, event({ recordedAt: "not-a-date" }))).toThrowError(
      new LearningEngineError("INVALID_EVENT"),
    );
    expect(() =>
      applyLearningEvent(projection, event({ knowledgeId: "knowledge:pass:verb" })),
    ).toThrowError(new LearningEngineError("KNOWLEDGE_MISMATCH"));
  });
});
