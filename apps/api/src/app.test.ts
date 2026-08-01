import "reflect-metadata";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";
import { HEALTH_DEPENDENCY, type HealthDependency } from "./platform/health/health-dependency.js";
import { requestIdMiddleware } from "./platform/request-id.middleware.js";

const applications: INestApplication[] = [];
type SupertestApplication = Parameters<typeof request>[0];

function httpServer(app: INestApplication): SupertestApplication {
  const server: unknown = app.getHttpServer();
  return server as SupertestApplication;
}

async function createTestApp(dependency: HealthDependency): Promise<INestApplication> {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(HEALTH_DEPENDENCY)
    .useValue(dependency)
    .compile();
  const app = module.createNestApplication();
  app.use(requestIdMiddleware);
  app.setGlobalPrefix("v1");
  await app.init();
  applications.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(applications.splice(0).map(async (app) => app.close()));
});

describe("API foundation", () => {
  it("reports liveness without checking external dependencies", async () => {
    const dependency: HealthDependency = { check: () => Promise.resolve(false) };
    const app = await createTestApp(dependency);
    await request(httpServer(app)).get("/v1/health/live").expect(200, { status: "ok" });
  });

  it("reports readiness when foundation dependencies are available", async () => {
    const app = await createTestApp({ check: () => Promise.resolve(true) });
    await request(httpServer(app)).get("/v1/health/ready").expect(200, { status: "ok" });
  });

  it("returns a safe readiness failure", async () => {
    const app = await createTestApp({ check: () => Promise.resolve(false) });
    const response = await request(httpServer(app)).get("/v1/health/ready").expect(503);
    expect(response.body).toEqual(expect.objectContaining({ status: "not_ready" }));
    expect(JSON.stringify(response.body)).not.toMatch(/stack|password|secret/iu);
  });

  it("preserves a safe request ID and replaces an unsafe one", async () => {
    const app = await createTestApp({ check: () => Promise.resolve(true) });
    await request(httpServer(app))
      .get("/v1/health/live")
      .set("x-request-id", "request_12345678")
      .expect("x-request-id", "request_12345678");
    const unsafe = await request(httpServer(app))
      .get("/v1/health/live")
      .set("x-request-id", "unsafe value");
    expect(unsafe.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/u);
  });
});
