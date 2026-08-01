export type AuthAudience = "learner" | "operator";

export interface AuthenticatedIdentity {
  readonly kind: "authenticated";
  readonly subjectId: string;
  readonly sessionId: string;
  readonly audience: AuthAudience;
  readonly expiresAt: Date;
}

export type AnonymousReason = "missing" | "invalid" | "expired";

export type SessionIdentity =
  AuthenticatedIdentity | { readonly kind: "anonymous"; readonly reason: AnonymousReason };

export interface SessionIdentityPort<TRequest> {
  resolve(request: TRequest): Promise<SessionIdentity>;
}
