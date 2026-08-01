import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { HEALTH_DEPENDENCY, type HealthDependency } from "./health-dependency.js";

interface HealthResponse {
  readonly status: "ok" | "not_ready";
}

@Controller("health")
export class HealthController {
  constructor(@Inject(HEALTH_DEPENDENCY) private readonly dependency: HealthDependency) {}

  @Get("live")
  live(): HealthResponse {
    return { status: "ok" };
  }

  @Get("ready")
  async ready(): Promise<HealthResponse> {
    if (!(await this.dependency.check())) {
      throw new ServiceUnavailableException({ status: "not_ready" });
    }
    return { status: "ok" };
  }
}
