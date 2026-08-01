export const HEALTH_DEPENDENCY = Symbol("HEALTH_DEPENDENCY");

export interface HealthDependency {
  check(): Promise<boolean>;
}

export class FoundationHealthDependency implements HealthDependency {
  check(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
