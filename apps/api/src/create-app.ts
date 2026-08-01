import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { ServerConfig } from "@vocabulary/config/server";
import { AppModule } from "./app.module.js";
import { requestIdMiddleware } from "./platform/request-id.middleware.js";

export async function createApp(config: ServerConfig): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: true,
    bufferLogs: true,
  });
  app.useLogger(new Logger("Api"));
  app.use(requestIdMiddleware);
  app.enableShutdownHooks();
  app.setGlobalPrefix("v1");
  app.getHttpAdapter().getInstance().disable("x-powered-by");
  await app.init();
  app.get(Logger).debug(`API initialized for ${config.NODE_ENV}`);
  return app;
}
