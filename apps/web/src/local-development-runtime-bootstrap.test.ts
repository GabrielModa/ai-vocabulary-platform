import { describe, expect, it } from "vitest";
import {
  configureLocalDevelopmentRuntime,
  createLocalDevelopmentIdentity,
} from "./local-development-runtime-bootstrap";

describe("local development runtime bootstrap", () => {
  it("creates a stable learner identity", async () => {
    const identity = createLocalDevelopmentIdentity(" learner-local ");

    await expect(identity.resolve(new Headers())).resolves.toMatchObject({
      kind: "authenticated",
      subjectId: "learner-local",
      sessionId: "local-development:learner-local",
      audience: "learner",
    });
  });

  it("never enables local authentication in production", () => {
    expect(
      configureLocalDevelopmentRuntime({
        NODE_ENV: "production",
        LOCAL_DEV_AUTH: "true",
        LOCAL_DEV_LEARNER_ID: "learner-local",
      }),
    ).toBe(false);
  });

  it("requires an explicit development flag", () => {
    expect(
      configureLocalDevelopmentRuntime({
        NODE_ENV: "development",
        LOCAL_DEV_AUTH: "false",
        LOCAL_DEV_LEARNER_ID: "learner-local",
      }),
    ).toBe(false);
  });

  it("rejects a missing learner ID", () => {
    expect(() =>
      configureLocalDevelopmentRuntime({
        NODE_ENV: "development",
        LOCAL_DEV_AUTH: "true",
        LOCAL_DEV_LEARNER_ID: " ",
      }),
    ).toThrow("LOCAL_DEV_AUTH requires LOCAL_DEV_LEARNER_ID");
  });
});
