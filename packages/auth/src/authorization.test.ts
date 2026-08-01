import { describe, expect, it } from "vitest";
import {
  DenyByDefaultPolicy,
  OwnedResourcePolicy,
  type AuthorizationContext,
} from "./authorization.js";
import { toSafeAccessError } from "./safe-error.js";

function context(overrides: Partial<AuthorizationContext> = {}): AuthorizationContext {
  return {
    identity: {
      kind: "authenticated",
      subjectId: "owner-1",
      sessionId: "session-1",
      audience: "learner",
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    },
    action: "resource.read",
    resource: { ownerId: "owner-1" },
    requirements: {
      audience: "learner",
      consents: ["learning-processing"],
      roles: ["learner"],
      entitlements: ["core"],
    },
    grants: {
      consents: ["learning-processing"],
      roles: ["learner"],
      entitlements: ["core"],
    },
    ...overrides,
  };
}

describe("authorization policies", () => {
  it("allows an owner only when explicit requirements are satisfied", () => {
    expect(new OwnedResourcePolicy().decide(context())).toEqual({
      allowed: true,
      reason: "policy_satisfied",
    });
  });

  it("denies anonymous access", () => {
    const decision = new OwnedResourcePolicy().decide(
      context({ identity: { kind: "anonymous", reason: "missing" } }),
    );
    expect(decision).toEqual({ allowed: false, reason: "anonymous" });
  });

  it("denies a non-owner without revealing resource existence", () => {
    const policy = new OwnedResourcePolicy();
    const ownerDecision = policy.decide(
      context({ grants: { consents: [], roles: [], entitlements: [] } }),
    );
    const nonOwnerDecision = policy.decide(context({ resource: { ownerId: "another-owner" } }));

    expect(nonOwnerDecision).toEqual({ allowed: false, reason: "not_owner" });
    expect(toSafeAccessError(nonOwnerDecision)).toEqual(toSafeAccessError(ownerDecision));
    expect(toSafeAccessError(nonOwnerDecision)).toEqual({
      code: "ACCESS_DENIED",
      message: "The request cannot be completed.",
      status: 404,
    });
  });

  it("denies when no explicit policy matches", () => {
    expect(new DenyByDefaultPolicy().decide(context())).toEqual({
      allowed: false,
      reason: "no_matching_policy",
    });
  });
});
