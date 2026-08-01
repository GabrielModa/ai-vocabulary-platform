import {
  createRequestContext,
  normalizeHttpMetricFields,
  type SafeTelemetry,
} from "@vocabulary/observability";
import type { NextFunction, Request, Response } from "express";

const REQUEST_ID_HEADER = "x-request-id";

export function requestTelemetryMiddleware(telemetry: SafeTelemetry) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const startedAt = performance.now();
    response.once("finish", () => {
      const requestId = String(response.getHeader(REQUEST_ID_HEADER));
      const fields = normalizeHttpMetricFields({
        method: request.method,
        route: request.path,
        statusCode: response.statusCode,
        durationMs: performance.now() - startedAt,
      });
      void telemetry.emit("metric", "http.request", createRequestContext(requestId), fields);
    });
    next();
  };
}
