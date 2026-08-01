export interface OpenApiSchema {
  readonly required?: readonly string[];
  readonly properties?: Readonly<Record<string, unknown>>;
  readonly [key: string]: unknown;
}

export interface OpenApiDocument {
  readonly openapi: "3.1.0";
  readonly info: { readonly title: string; readonly version: string };
  readonly paths: Readonly<Record<string, unknown>>;
  readonly components: {
    readonly schemas: Readonly<Record<string, OpenApiSchema>>;
    readonly headers: Readonly<Record<string, unknown>>;
  };
}

const requestIdHeader = {
  description: "Stable correlation identifier for this request.",
  schema: { type: "string", minLength: 8, maxLength: 128 },
} as const;

const responseHeaders = {
  "x-request-id": { $ref: "#/components/headers/RequestId" },
} as const;

const healthSchema = {
  type: "object",
  additionalProperties: false,
  required: ["status"],
  properties: { status: { type: "string", enum: ["ok"] } },
} as const;

export function createOpenApiDocument(): OpenApiDocument {
  return {
    openapi: "3.1.0",
    info: { title: "AI Vocabulary Platform API", version: "1.0.0" },
    paths: {
      "/v1/health/live": {
        get: {
          operationId: "getLiveness",
          summary: "Check process liveness",
          responses: {
            "200": {
              description: "The API process is alive.",
              headers: responseHeaders,
              content: { "application/json": { schema: { $ref: "#/components/schemas/Health" } } },
            },
          },
        },
      },
      "/v1/health/ready": {
        get: {
          operationId: "getReadiness",
          summary: "Check dependency readiness",
          responses: {
            "200": {
              description: "The API is ready to serve traffic.",
              headers: responseHeaders,
              content: { "application/json": { schema: { $ref: "#/components/schemas/Health" } } },
            },
            "503": {
              description: "A required dependency is unavailable.",
              headers: responseHeaders,
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/NotReadyError" } },
              },
            },
          },
        },
      },
    },
    components: {
      headers: { RequestId: requestIdHeader },
      schemas: {
        Health: healthSchema,
        NotReadyError: {
          type: "object",
          additionalProperties: false,
          required: ["status"],
          properties: { status: { type: "string", enum: ["not_ready"] } },
        },
        Error: {
          type: "object",
          additionalProperties: false,
          required: ["code", "message", "requestId"],
          properties: {
            code: { type: "string", minLength: 1 },
            message: { type: "string", minLength: 1 },
            requestId: { type: "string", minLength: 8, maxLength: 128 },
          },
        },
      },
    },
  };
}
