export interface OperatorAccessRequest {
  readonly capability: string;
}

export type OperatorAccessDecision =
  { readonly allowed: true } | { readonly allowed: false; readonly reason: "unauthorized" };

export interface OperatorAuthorizationPort {
  authorize(request: OperatorAccessRequest): Promise<OperatorAccessDecision>;
}

export interface OperatorAuthorizationAuditEvent {
  readonly action: "operator.authorization.denied";
  readonly capability: string;
}
