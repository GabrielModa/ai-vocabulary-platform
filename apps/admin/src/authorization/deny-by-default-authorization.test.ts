import { describe, expect, it } from "vitest";
import { DenyByDefaultOperatorAuthorization } from "./deny-by-default-authorization";

describe("DenyByDefaultOperatorAuthorization", () => {
  it("denies unauthenticated access and audits the attempt", async () => {
    const authorization = new DenyByDefaultOperatorAuthorization();

    await expect(authorization.authorize({ capability: "operator.shell" })).resolves.toEqual({
      allowed: false,
      reason: "unauthorized",
    });
    expect(authorization.auditEvents).toEqual([
      {
        action: "operator.authorization.denied",
        capability: "operator.shell",
      },
    ]);
  });
});
