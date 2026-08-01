import type { TelemetryExporter, TelemetrySignal } from "./telemetry.js";

export class CapturingTelemetryExporter implements TelemetryExporter {
  readonly signals: TelemetrySignal[] = [];

  export(signal: TelemetrySignal): Promise<void> {
    this.signals.push(structuredClone(signal));
    return Promise.resolve();
  }
}

export class FailingTelemetryExporter implements TelemetryExporter {
  export(_signal: TelemetrySignal): Promise<void> {
    void _signal;
    return Promise.reject(new Error("Exporter unavailable"));
  }
}
