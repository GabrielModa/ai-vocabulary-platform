import { sql, type SQL } from "drizzle-orm";

export interface HealthQueryExecutor {
  execute(query: SQL): Promise<unknown>;
}

export type DatabaseHealth =
  { readonly status: "up"; readonly latencyMs: number } | { readonly status: "down" };

export class DatabaseHealthAdapter {
  constructor(
    private readonly executor: HealthQueryExecutor,
    private readonly now: () => number = () => performance.now(),
  ) {}

  async check(): Promise<DatabaseHealth> {
    const startedAt = this.now();
    try {
      await this.executor.execute(sql`select 1`);
      return { status: "up", latencyMs: Math.max(0, this.now() - startedAt) };
    } catch {
      return { status: "down" };
    }
  }
}
