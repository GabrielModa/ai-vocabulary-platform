import { Module } from "@nestjs/common";
import { HealthController } from "./platform/health/health.controller.js";
import {
  FoundationHealthDependency,
  HEALTH_DEPENDENCY,
} from "./platform/health/health-dependency.js";

@Module({
  controllers: [HealthController],
  providers: [{ provide: HEALTH_DEPENDENCY, useClass: FoundationHealthDependency }],
})
export class AppModule {
  readonly moduleName = "api";
}
