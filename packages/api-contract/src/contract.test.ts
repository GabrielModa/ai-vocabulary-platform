import { describe, expect, it } from "vitest";
import { findBreakingChanges, lintOpenApi } from "./compatibility.js";
import { generateClientSource, serializeOpenApi } from "./generator.js";
import { createOpenApiDocument } from "./spec.js";

describe("OpenAPI contract", () => {
  it("generates a deterministic, lint-clean specification", () => {
    const first = createOpenApiDocument();
    const second = createOpenApiDocument();
    expect(serializeOpenApi(first)).toBe(serializeOpenApi(second));
    expect(lintOpenApi(first)).toEqual([]);
    expect(Object.keys(first.paths)).toEqual(["/v1/health/live", "/v1/health/ready"]);
  });

  it("publishes the common safe error contract", () => {
    const errorSchema = createOpenApiDocument().components.schemas.Error;
    expect(errorSchema).toEqual(
      expect.objectContaining({
        additionalProperties: false,
        required: ["code", "message", "requestId"],
      }),
    );
  });

  it("detects removal of a required response field", () => {
    const baseline = createOpenApiDocument();
    const candidate = structuredClone(baseline);
    const schemas = candidate.components.schemas as Record<
      string,
      { required?: string[]; properties?: Record<string, unknown> }
    >;
    schemas.Health = { required: [], properties: {} };
    expect(findBreakingChanges(baseline, candidate)).toContain(
      "Removed required field: Health.status",
    );
  });

  it("generates a client that contains no server implementation import", () => {
    const source = generateClientSource();
    expect(source).toContain("export function createApiClient");
    expect(source).not.toMatch(/@nestjs|apps\/api|health\.controller/iu);
  });
});
