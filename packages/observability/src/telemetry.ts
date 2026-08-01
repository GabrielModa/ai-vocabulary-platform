import type { TraceContext } from "./context.js";

export type TelemetryLevel = "debug" | "info" | "warn" | "error";
export type TelemetryKind = "log" | "metric" | "trace";

export interface TelemetrySignal {
  readonly kind: TelemetryKind;
  readonly name: string;
  readonly level: TelemetryLevel;
  readonly timestamp: string;
  readonly context: TraceContext;
  readonly fields: Readonly<Record<string, string | number | boolean>>;
}

export interface TelemetryExporter {
  export(signal: TelemetrySignal): Promise<void>;
}

const allowedFields = new Set([
  "dependency",
  "durationMs",
  "method",
  "outcome",
  "route",
  "statusCode",
]);

export function redactFields(
  fields: Readonly<Record<string, unknown>>,
): Readonly<Record<string, string | number | boolean>> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!allowedFields.has(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    }
  }
  return Object.freeze(safe);
}

export class SafeTelemetry {
  constructor(
    private readonly exporter: TelemetryExporter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async emit(
    kind: TelemetryKind,
    name: string,
    context: TraceContext,
    fields: Readonly<Record<string, unknown>> = {},
    level: TelemetryLevel = "info",
  ): Promise<boolean> {
    try {
      await this.exporter.export({
        kind,
        name,
        level,
        timestamp: this.now().toISOString(),
        context,
        fields: redactFields(fields),
      });
      return true;
    } catch {
      return false;
    }
  }
}

export class NoopTelemetryExporter implements TelemetryExporter {
  export(_signal: TelemetrySignal): Promise<void> {
    void _signal;
    return Promise.resolve();
  }
}
