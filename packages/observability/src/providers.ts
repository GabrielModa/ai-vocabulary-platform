import { NoopTelemetryExporter, type TelemetryExporter } from "./telemetry.js";

export interface ProviderConfiguration {
  readonly sentryDsn?: string | undefined;
  readonly posthogKey?: string | undefined;
  readonly enabled: boolean;
}

export interface ProviderAdapters {
  readonly exporter: TelemetryExporter;
  readonly sentryEnabled: boolean;
  readonly posthogEnabled: boolean;
}

export function createProviderAdapters(configuration: ProviderConfiguration): ProviderAdapters {
  if (!configuration.enabled) {
    return {
      exporter: new NoopTelemetryExporter(),
      sentryEnabled: false,
      posthogEnabled: false,
    };
  }
  return {
    exporter: new NoopTelemetryExporter(),
    sentryEnabled: Boolean(configuration.sentryDsn),
    posthogEnabled: Boolean(configuration.posthogKey),
  };
}
