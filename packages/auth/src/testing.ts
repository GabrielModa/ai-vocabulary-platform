import type {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationPolicy,
} from "./authorization.js";
import type { SessionIdentity, SessionIdentityPort } from "./identity.js";

export class FakeSessionIdentityPort<TRequest> implements SessionIdentityPort<TRequest> {
  constructor(private readonly identity: SessionIdentity) {}

  resolve(request: TRequest): Promise<SessionIdentity> {
    void request;
    return Promise.resolve(this.identity);
  }
}

export class RecordingAuthorizationPolicy implements AuthorizationPolicy {
  readonly contexts: AuthorizationContext[] = [];

  constructor(private readonly decision: AuthorizationDecision) {}

  decide(context: AuthorizationContext): AuthorizationDecision {
    this.contexts.push(context);
    return this.decision;
  }
}
