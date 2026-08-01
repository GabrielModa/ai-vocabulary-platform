import type { AuthorizationDecision } from "./authorization.js";
import type { SessionIdentity } from "./identity.js";

export interface SafeAccessError {
  readonly code: "ACCESS_DENIED";
  readonly message: "The request cannot be completed.";
  readonly status: 404;
}

export function toSafeAccessError(
  result: AuthorizationDecision | SessionIdentity,
): SafeAccessError {
  void result;
  return {
    code: "ACCESS_DENIED",
    message: "The request cannot be completed.",
    status: 404,
  };
}
