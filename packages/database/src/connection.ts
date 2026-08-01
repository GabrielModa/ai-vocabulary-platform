import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export type Database = PostgresJsDatabase<typeof schema>;

export interface DatabaseConnection {
  readonly database: Database;
  close(): Promise<void>;
}

export interface DatabaseConnectionOptions {
  readonly url: string;
  readonly maxConnections?: number;
}

export function createDatabaseConnection({
  maxConnections = 10,
  url,
}: DatabaseConnectionOptions): DatabaseConnection {
  const parsed = new URL(url);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("Database URL must use the postgres protocol");
  }
  if (!Number.isInteger(maxConnections) || maxConnections < 1) {
    throw new Error("Database maxConnections must be a positive integer");
  }

  const client = postgres(url, {
    max: maxConnections,
    connect_timeout: 10,
    idle_timeout: 20,
    prepare: false,
  });

  return {
    database: drizzle({ client, schema }),
    close: async () => client.end({ timeout: 5 }),
  };
}
