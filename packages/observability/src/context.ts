export interface TraceContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

export interface JobEnvelope<T> {
  readonly id: string;
  readonly context: TraceContext;
  readonly payload: T;
}

export function createRequestContext(requestId: string): TraceContext {
  return Object.freeze({ requestId, correlationId: requestId });
}

export function createJobEnvelope<T>(id: string, payload: T, parent: TraceContext): JobEnvelope<T> {
  return Object.freeze({
    id,
    payload,
    context: Object.freeze({
      requestId: parent.requestId,
      correlationId: parent.correlationId,
      causationId: parent.causationId ?? parent.requestId,
    }),
  });
}
