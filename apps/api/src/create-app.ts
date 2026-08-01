import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { ServerConfig } from "@vocabulary/config/server";
import { createProviderAdapters, SafeTelemetry } from "@vocabulary/observability";
import { AppModule } from "./app.module.js";
import { requestIdMiddleware } from "./platform/request-id.middleware.js";
import { requestTelemetryMiddleware } from "./platform/request-telemetry.middleware.js";

export async function createApp(config: ServerConfig): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: true,
    bufferLogs: true,
  });
  app.useLogger(new Logger("Api"));
  app.use(requestIdMiddleware);
  const providers = createProviderAdapters({
    enabled: config.NODE_ENV !== "development" && config.NODE_ENV !== "test",
    sentryDsn: config.SENTRY_DSN,
    posthogKey: config.POSTHOG_KEY,
  });
  app.use(requestTelemetryMiddleware(new SafeTelemetry(providers.exporter)));
  app.enableShutdownHooks();
  app.setGlobalPrefix("v1");
  app.getHttpAdapter().getInstance().disable("x-powered-by");
  await app.init();
  app.get(Logger).debug(`API initialized for ${config.NODE_ENV}`);
  return app;
}
