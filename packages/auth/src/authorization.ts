import type { AuthenticatedIdentity, SessionIdentity } from "./identity.js";

export type AuthorizationDenialReason =
  | "anonymous"
  | "wrong_audience"
  | "not_owner"
  | "missing_consent"
  | "missing_role"
  | "missing_entitlement"
  | "no_matching_policy";

export type AuthorizationDecision =
  | { readonly allowed: true; readonly reason: "policy_satisfied" }
  | { readonly allowed: false; readonly reason: AuthorizationDenialReason };

export interface AuthorizationRequirements {
  readonly audience: "learner" | "operator";
  readonly consents?: readonly string[];
  readonly roles?: readonly string[];
  readonly entitlements?: readonly string[];
}

export interface AuthorizationGrants {
  readonly consents: readonly string[];
  readonly roles: readonly string[];
  readonly entitlements: readonly string[];
}

export interface AuthorizationResource {
  readonly ownerId: string;
}

export interface AuthorizationContext {
  readonly identity: SessionIdentity;
  readonly action: string;
  readonly resource: AuthorizationResource;
  readonly requirements: AuthorizationRequirements;
  readonly grants: AuthorizationGrants;
}

export interface AuthorizationPolicy {
  decide(context: AuthorizationContext): AuthorizationDecision;
}

function hasEvery(granted: readonly string[], required: readonly string[] = []): boolean {
  return required.every((value) => granted.includes(value));
}

function authenticated(identity: SessionIdentity): identity is AuthenticatedIdentity {
  return identity.kind === "authenticated";
}

export class OwnedResourcePolicy implements AuthorizationPolicy {
  decide(context: AuthorizationContext): AuthorizationDecision {
    if (!authenticated(context.identity)) return { allowed: false, reason: "anonymous" };
    if (context.identity.audience !== context.requirements.audience) {
      return { allowed: false, reason: "wrong_audience" };
    }
    if (context.identity.subjectId !== context.resource.ownerId) {
      return { allowed: false, reason: "not_owner" };
    }
    if (!hasEvery(context.grants.consents, context.requirements.consents)) {
      return { allowed: false, reason: "missing_consent" };
    }
    if (!hasEvery(context.grants.roles, context.requirements.roles)) {
      return { allowed: false, reason: "missing_role" };
    }
    if (!hasEvery(context.grants.entitlements, context.requirements.entitlements)) {
      return { allowed: false, reason: "missing_entitlement" };
    }
    return { allowed: true, reason: "policy_satisfied" };
  }
}

export class DenyByDefaultPolicy implements AuthorizationPolicy {
  decide(context: AuthorizationContext): AuthorizationDecision {
    void context;
    return { allowed: false, reason: "no_matching_policy" };
  }
}
