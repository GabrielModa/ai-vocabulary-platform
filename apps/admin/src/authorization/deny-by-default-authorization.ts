import type {
  OperatorAccessDecision,
  OperatorAccessRequest,
  OperatorAuthorizationAuditEvent,
  OperatorAuthorizationPort,
} from "./operator-authorization";

export class DenyByDefaultOperatorAuthorization implements OperatorAuthorizationPort {
  readonly auditEvents: OperatorAuthorizationAuditEvent[] = [];

  authorize(request: OperatorAccessRequest): Promise<OperatorAccessDecision> {
    this.auditEvents.push({
      action: "operator.authorization.denied",
      capability: request.capability,
    });

    return Promise.resolve({ allowed: false, reason: "unauthorized" });
  }
}
