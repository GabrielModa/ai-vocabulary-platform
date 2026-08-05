import type { SessionIdentityPort } from "@vocabulary/auth";
import { configureStudySessionRuntime } from "./study-session-runtime-registry";

export interface LocalDevelopmentRuntimeEnvironment {
  readonly NODE_ENV?: string;
  readonly LOCAL_DEV_AUTH?: string;
  readonly LOCAL_DEV_LEARNER_ID?: string;
}

function normalized(value: string | undefined): string {
  return value?.normalize("NFKC").trim() ?? "";
}

export function createLocalDevelopmentIdentity(subjectId: string): SessionIdentityPort<Headers> {
  const learnerId = normalized(subjectId);
  if (!learnerId) {
    throw new Error("LOCAL_DEV_LEARNER_ID must be non-empty");
  }

  return Object.freeze({
    resolve() {
      return Promise.resolve({
        kind: "authenticated" as const,
        subjectId: learnerId,
        sessionId: `local-development:${learnerId}`,
        audience: "learner" as const,
        expiresAt: new Date("2999-12-31T23:59:59.999Z"),
      });
    },
  });
}

export function configureLocalDevelopmentRuntime(
  environment: LocalDevelopmentRuntimeEnvironment = process.env,
): boolean {
  if (environment.NODE_ENV !== "development" || environment.LOCAL_DEV_AUTH !== "true") {
    return false;
  }

  const learnerId = normalized(environment.LOCAL_DEV_LEARNER_ID);
  if (!learnerId) {
    throw new Error("LOCAL_DEV_AUTH requires LOCAL_DEV_LEARNER_ID");
  }

  configureStudySessionRuntime({
    identity: createLocalDevelopmentIdentity(learnerId),
  });

  return true;
}
