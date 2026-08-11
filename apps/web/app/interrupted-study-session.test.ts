import { describe, expect, it } from "vitest";
import {
  clearInterruptedStudySession,
  readInterruptedStudySession,
  saveInterruptedStudySession,
  type InterruptedStudySession,
  type SessionStorage,
} from "./interrupted-study-session";

function storage(initial?: string): SessionStorage & { value: string | undefined } {
  return {
    value: initial,
    getItem() {
      return this.value ?? null;
    },
    setItem(_key, value) {
      this.value = value;
    },
    removeItem() {
      this.value = undefined;
    },
  };
}

const session: InterruptedStudySession = {
  version: 1,
  savedAt: "2026-08-11T12:00:00.000Z",
  title: "Football practice",
  level: "B1",
  candidates: [
    {
      candidateId: "candidate:pitch",
      senseId: "sense:pitch",
      term: "pitch",
      meaning: "The playing surface.",
      type: "noun",
      example: "The pitch is wet.",
      challenge: "They walked onto the ___.",
      contexts: ["The pitch is wet."],
    },
  ],
  selectedTerms: ["pitch"],
  questionIndex: 0,
  chosenTerm: "pitch",
  attempts: [],
};

describe("interrupted study session", () => {
  it("round-trips a bounded versioned snapshot", () => {
    const target = storage();
    saveInterruptedStudySession(target, session);
    expect(readInterruptedStudySession(target, new Date("2026-08-12T12:00:00.000Z"))).toEqual(
      session,
    );
  });

  it.each([
    ["malformed JSON", "{"],
    ["unsupported version", JSON.stringify({ ...session, version: 2 })],
    ["invalid candidate", JSON.stringify({ ...session, candidates: [{ term: "pitch" }] })],
  ])("removes %s instead of trusting it", (_label, value) => {
    const target = storage(value);
    expect(
      readInterruptedStudySession(target, new Date("2026-08-12T12:00:00.000Z")),
    ).toBeUndefined();
    expect(target.value).toBeUndefined();
  });

  it("removes expired sessions and supports explicit clearing", () => {
    const expired = storage(JSON.stringify(session));
    expect(
      readInterruptedStudySession(expired, new Date("2026-08-20T12:00:00.000Z")),
    ).toBeUndefined();
    expect(expired.value).toBeUndefined();

    const current = storage(JSON.stringify(session));
    clearInterruptedStudySession(current);
    expect(current.value).toBeUndefined();
  });

  it("removes oversized data and tolerates unavailable storage", () => {
    const oversized = storage("x".repeat(256_001));
    expect(readInterruptedStudySession(oversized)).toBeUndefined();
    expect(oversized.value).toBeUndefined();

    const unavailable: SessionStorage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
      removeItem() {
        throw new Error("blocked");
      },
    };
    expect(() => {
      saveInterruptedStudySession(unavailable, session);
    }).not.toThrow();
    expect(() => {
      clearInterruptedStudySession(unavailable);
    }).not.toThrow();
    expect(readInterruptedStudySession(unavailable)).toBeUndefined();
  });
});
