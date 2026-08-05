import { BetterAuthIdentityAdapter, type BetterAuthSessionApi } from "@vocabulary/auth/better-auth";
import { configureStudySessionRuntime } from "./study-session-runtime-registry";

export interface BetterAuthRuntimeBootstrapOptions {
  readonly api: BetterAuthSessionApi;
  readonly now?: () => Date;
}

export function configureBetterAuthRuntime({ api, now }: BetterAuthRuntimeBootstrapOptions): void {
  configureStudySessionRuntime({
    identity: new BetterAuthIdentityAdapter({
      api,
      audience: "learner",
      ...(now ? { now } : {}),
    }),
  });
}
