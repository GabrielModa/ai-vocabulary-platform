import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrateTestDatabase } from "./migrations.js";
import * as schema from "./schema.js";

export interface TestDatabase {
  readonly client: PGlite;
  readonly database: PgliteDatabase<typeof schema>;
  close(): Promise<void>;
  reset(): Promise<void>;
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const client = await PGlite.create();
  const database = drizzle({ client, schema });
  await migrateTestDatabase(database);

  return {
    client,
    database,
    close: async () => client.close(),
    reset: async () => {
      await database.delete(schema.studySessionSnapshots);
      await database.delete(schema.platformOutbox);
      await database.delete(schema.platformInbox);
      await database.delete(schema.platformIdempotency);
    },
  };
}
