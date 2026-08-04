import type { SessionIdentityPort } from "@vocabulary/auth";
import type { StudySessionDraftPort } from "../app/api/study-sessions/http";
import { afterEach, describe, expect, it } from "vitest";
import {
  configureStudySessionRuntime,
  getStudySessionRuntime,
  resetStudySessionRuntimeForTests,
  StudySessionRuntimeUnavailableError,
} from "./study-session-runtime-registry";

const identity: SessionIdentityPort<Headers> = {
  resolve() {
    return Promise.resolve({
      kind: "anonymous",
      reason: "missing",
    });
  },
};

const drafts: StudySessionDraftPort = {
  resolve() {
    return Promise.resolve({
      ok: false,
      code: "draft-not-found",
      message: "Draft was not found",
    });
  },
};

const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(async () => {
  await resetStudySessionRuntimeForTests();
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

describe("study-session runtime registry", () => {
  it("fails closed before adapters are configured", () => {
    expect(() => getStudySessionRuntime()).toThrow(StudySessionRuntimeUnavailableError);
  });

  it("fails closed when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    configureStudySessionRuntime({ identity, drafts });

    expect(() => getStudySessionRuntime()).toThrow(StudySessionRuntimeUnavailableError);
  });

  it("reuses the runtime singleton after configuration", () => {
    process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/vocabulary";
    configureStudySessionRuntime({ identity, drafts });

    const first = getStudySessionRuntime();
    const second = getStudySessionRuntime();

    expect(second).toBe(first);
  });
});
