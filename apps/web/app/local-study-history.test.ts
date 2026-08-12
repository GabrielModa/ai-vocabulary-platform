import { describe, expect, it } from "vitest";
import {
  appendCompletedStudySession,
  readCompletedStudySessions,
  type CompletedStudySession,
  type StudyHistoryStorage,
} from "./local-study-history.js";

class MemoryStorage implements StudyHistoryStorage {
  readonly values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

function completed(overrides: Partial<CompletedStudySession> = {}): CompletedStudySession {
  return {
    version: 1,
    sessionId: "session-1",
    completedAt: "2026-08-11T12:00:00.000Z",
    title: "Football words",
    level: "B1",
    candidates: [
      {
        term: "pitch",
        meaning: "The playing surface.",
        type: "noun",
        example: "The pitch is wet.",
        challenge: "The players entered the ___.",
      },
    ],
    selectedTerms: ["pitch"],
    attempts: [{ term: "pitch", chosenTerm: "pass", correct: false }],
    score: { correct: 0, attempted: 1, percentage: 0 },
    ...overrides,
  };
}

describe("local study history", () => {
  it("appends an immutable completed-session event and returns a defensive value", () => {
    const storage = new MemoryStorage();
    appendCompletedStudySession(storage, completed());

    const history = readCompletedStudySessions(storage);
    expect(history).toEqual([completed()]);
    expect(Object.isFrozen(history)).toBe(true);
    expect(Object.isFrozen(history[0])).toBe(true);
    expect(Object.isFrozen(history[0]?.candidates[0])).toBe(true);
    expect(Object.isFrozen(history[0]?.attempts[0])).toBe(true);
    expect(JSON.parse(storage.getItem("lexi.completed-study-sessions") ?? "null")).toMatchObject({
      schemaVersion: 2,
    });
  });

  it("deduplicates completion by session identifier", () => {
    const storage = new MemoryStorage();
    appendCompletedStudySession(storage, completed());
    appendCompletedStudySession(storage, completed({ title: "Changed" }));

    expect(readCompletedStudySessions(storage)).toEqual([completed()]);
  });

  it("retains only the 50 newest valid sessions", () => {
    const storage = new MemoryStorage();
    for (let index = 0; index < 55; index += 1) {
      appendCompletedStudySession(
        storage,
        completed({
          sessionId: `session-${String(index)}`,
          completedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
        }),
      );
    }

    const history = readCompletedStudySessions(storage);
    expect(history).toHaveLength(50);
    expect(history[0]?.sessionId).toBe("session-54");
    expect(history.at(-1)?.sessionId).toBe("session-5");
  });

  it("removes malformed history but preserves an unknown future version", () => {
    const storage = new MemoryStorage();
    storage.setItem("lexi.completed-study-sessions", "not-json");
    expect(readCompletedStudySessions(storage)).toEqual([]);
    expect(storage.getItem("lexi.completed-study-sessions")).toBeNull();

    const future = JSON.stringify({ schemaVersion: 99, sessions: [completed()] });
    storage.setItem("lexi.completed-study-sessions", future);
    expect(readCompletedStudySessions(storage)).toEqual([]);
    expect(storage.getItem("lexi.completed-study-sessions")).toBe(future);
  });

  it("migrates a validated version 1 envelope to version 2", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "lexi.completed-study-sessions",
      JSON.stringify({ version: 1, sessions: [completed()] }),
    );

    expect(readCompletedStudySessions(storage)).toEqual([completed()]);
    expect(JSON.parse(storage.getItem("lexi.completed-study-sessions") ?? "null")).toEqual({
      schemaVersion: 2,
      sessions: [completed()],
    });
  });

  it("returns validated legacy history when migration storage is unavailable", () => {
    const legacy = JSON.stringify({ version: 1, sessions: [completed()] });
    const storage: StudyHistoryStorage = {
      getItem: () => legacy,
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => undefined,
    };

    expect(readCompletedStudySessions(storage)).toEqual([completed()]);
  });

  it("rejects inconsistent scores and unsafe candidate references", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "lexi.completed-study-sessions",
      JSON.stringify({
        version: 1,
        sessions: [completed({ score: { correct: 3, attempted: 1, percentage: 300 } })],
      }),
    );

    expect(readCompletedStudySessions(storage)).toEqual([]);
    expect(storage.getItem("lexi.completed-study-sessions")).toBeNull();
  });

  it("does not throw when storage is unavailable", () => {
    const storage: StudyHistoryStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readCompletedStudySessions(storage)).toEqual([]);
    expect(() => {
      appendCompletedStudySession(storage, completed());
    }).not.toThrow();
  });
});
