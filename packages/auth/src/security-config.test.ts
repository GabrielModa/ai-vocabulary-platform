import { describe, expect, it } from "vitest";
import { createAuthSecurityConfiguration } from "./security-config.js";

describe("auth security configuration", () => {
  it("enforces host-only secure cookies, CSRF, trusted origins, and rotation", () => {
    const config = createAuthSecurityConfiguration({
      environment: "production",
      trustedOrigins: ["https://app.example.com"],
    });
    expect(config).toEqual({
      trustedOrigins: ["https://app.example.com"],
      cookies: { httpOnly: true, secure: true, sameSite: "lax", hostOnly: true },
      csrf: { enabled: true, originValidation: true },
      session: { rotateAfterSeconds: 86_400, expiresAfterSeconds: 604_800 },
    });
    expect(config.session.rotateAfterSeconds).toBeLessThan(config.session.expiresAfterSeconds);
  });

  const unsafeOrigins: readonly (readonly [readonly string[]])[] = [
    [[]],
    [["https://*.example.com"]],
    [["https://app.example.com/path"]],
    [["http://app.example.com"]],
  ];

  it.each(unsafeOrigins)("rejects unsafe production origins: %j", (trustedOrigins) => {
    expect(() =>
      createAuthSecurityConfiguration({ environment: "production", trustedOrigins }),
    ).toThrow();
  });
});
