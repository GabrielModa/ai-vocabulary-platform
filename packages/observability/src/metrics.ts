const knownRoutes = new Set(["/v1/health/live", "/v1/health/ready"]);

export function normalizeHttpMetricFields(input: {
  readonly method: string;
  readonly route: string;
  readonly statusCode: number;
  readonly durationMs: number;
}): Readonly<Record<string, string | number>> {
  return Object.freeze({
    method: input.method.toUpperCase(),
    route: knownRoutes.has(input.route) ? input.route : "unknown",
    statusCode: Math.floor(input.statusCode / 100) * 100,
    durationMs: Math.max(0, Math.round(input.durationMs)),
  });
}
