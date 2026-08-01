import { z } from "zod";
import type { AuthAudience, SessionIdentity, SessionIdentityPort } from "./identity.js";

const betterAuthSessionSchema = z.object({
  user: z.object({ id: z.string().min(1) }),
  session: z.object({
    id: z.string().min(1),
    expiresAt: z.coerce.date(),
  }),
});

export interface BetterAuthSessionApi {
  getSession(input: { readonly headers: Headers }): Promise<unknown>;
}

export interface BetterAuthIdentityAdapterOptions {
  readonly api: BetterAuthSessionApi;
  readonly audience: AuthAudience;
  readonly now?: () => Date;
}

export class BetterAuthIdentityAdapter implements SessionIdentityPort<Headers> {
  private readonly api: BetterAuthSessionApi;
  private readonly audience: AuthAudience;
  private readonly now: () => Date;

  constructor({ api, audience, now = () => new Date() }: BetterAuthIdentityAdapterOptions) {
    this.api = api;
    this.audience = audience;
    this.now = now;
  }

  async resolve(headers: Headers): Promise<SessionIdentity> {
    let rawSession: unknown;
    try {
      rawSession = await this.api.getSession({ headers });
    } catch {
      return { kind: "anonymous", reason: "invalid" };
    }

    if (rawSession === null || rawSession === undefined) {
      return { kind: "anonymous", reason: "missing" };
    }

    const parsed = betterAuthSessionSchema.safeParse(rawSession);
    if (!parsed.success) return { kind: "anonymous", reason: "invalid" };
    if (parsed.data.session.expiresAt <= this.now()) {
      return { kind: "anonymous", reason: "expired" };
    }

    return {
      kind: "authenticated",
      subjectId: parsed.data.user.id,
      sessionId: parsed.data.session.id,
      audience: this.audience,
      expiresAt: parsed.data.session.expiresAt,
    };
  }
}
