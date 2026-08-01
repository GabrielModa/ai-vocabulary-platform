import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const REQUEST_ID_HEADER = "x-request-id";
const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{8,128}$/u;

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const provided = request.header(REQUEST_ID_HEADER);
  const requestId = provided && SAFE_REQUEST_ID.test(provided) ? provided : randomUUID();
  response.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
