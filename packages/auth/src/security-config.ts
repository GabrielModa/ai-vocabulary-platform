import { z } from "zod";

const exactOrigin = z.url().refine((value) => {
  const url = new URL(value);
  return url.pathname === "/" && !url.search && !url.hash && !url.hostname.includes("*");
}, "Trusted origins must be exact origins");

export interface AuthSecurityConfiguration {
  readonly trustedOrigins: readonly string[];
  readonly cookies: {
    readonly httpOnly: true;
    readonly secure: boolean;
    readonly sameSite: "lax";
    readonly hostOnly: true;
  };
  readonly csrf: {
    readonly enabled: true;
    readonly originValidation: true;
  };
  readonly session: {
    readonly rotateAfterSeconds: number;
    readonly expiresAfterSeconds: number;
  };
}

export function createAuthSecurityConfiguration(input: {
  readonly environment: "development" | "test" | "staging" | "production";
  readonly trustedOrigins: readonly string[];
}): AuthSecurityConfiguration {
  const trustedOrigins = z.array(exactOrigin).min(1).parse(input.trustedOrigins);
  if (
    input.environment === "production" &&
    trustedOrigins.some((origin) => new URL(origin).protocol !== "https:")
  ) {
    throw new Error("Production auth origins must use HTTPS");
  }

  const configuration: AuthSecurityConfiguration = {
    trustedOrigins: Object.freeze([...trustedOrigins]),
    cookies: {
      httpOnly: true,
      secure: input.environment === "production" || input.environment === "staging",
      sameSite: "lax",
      hostOnly: true,
    },
    csrf: { enabled: true, originValidation: true },
    session: {
      rotateAfterSeconds: 60 * 60 * 24,
      expiresAfterSeconds: 60 * 60 * 24 * 7,
    },
  };
  return Object.freeze(configuration);
}
