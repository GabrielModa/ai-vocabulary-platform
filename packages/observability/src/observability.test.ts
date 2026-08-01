import { describe, expect, it } from "vitest";
import { createJobEnvelope, createRequestContext } from "./context.js";
import { normalizeHttpMetricFields } from "./metrics.js";
import { createProviderAdapters } from "./providers.js";
import { SafeTelemetry } from "./telemetry.js";
import { CapturingTelemetryExporter, FailingTelemetryExporter } from "./testing.js";

describe("observability foundation", () => {
  it("preserves correlation across a simulated job boundary", () => {
    const context = createRequestContext("request_12345678");
    const job = createJobEnvelope("job_1", { vocabularySetId: "set_1" }, context);
    expect(job.context).toEqual({
      requestId: "request_12345678",
      correlationId: "request_12345678",
      causationId: "request_12345678",
    });
  });

  it("removes secrets and classified fixture fields while retaining request ID", async () => {
    const exporter = new CapturingTelemetryExporter();
    const telemetry = new SafeTelemetry(exporter, () => new Date("2026-01-01T00:00:00.000Z"));
    const secret = "classified-test-secret";
    await telemetry.emit("log", "request.received", createRequestContext("request_12345678"), {
      route: "/v1/health/live",
      password: secret,
      authorization: `Bearer ${secret}`,
      learnerText: secret,
    });
    expect(JSON.stringify(exporter.signals)).not.toContain(secret);
    expect(exporter.signals[0]?.context.requestId).toBe("request_12345678");
  });

  it("contains exporter failure without failing application work", async () => {
    const telemetry = new SafeTelemetry(new FailingTelemetryExporter());
    await expect(
      telemetry.emit("metric", "http.request", createRequestContext("request_12345678")),
    ).resolves.toBe(false);
  });

  it("keeps provider adapters disabled by default", () => {
    const providers = createProviderAdapters({
      enabled: false,
      sentryDsn: "https://private.example",
      posthogKey: "private-key",
    });
    expect(providers.sentryEnabled).toBe(false);
    expect(providers.posthogEnabled).toBe(false);
  });

  it("bounds request metric cardinality", () => {
    expect(
      normalizeHttpMetricFields({
        method: "get",
        route: "/v1/learners/user-specific-value",
        statusCode: 201,
        durationMs: 12.4,
      }),
    ).toEqual({ method: "GET", route: "unknown", statusCode: 200, durationMs: 12 });
  });
});
