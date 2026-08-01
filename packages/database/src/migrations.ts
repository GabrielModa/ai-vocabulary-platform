import { fileURLToPath } from "node:url";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import type { Database } from "./connection.js";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import type * as schema from "./schema.js";

export const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

export async function migrateDatabase(database: Database): Promise<void> {
  await migratePostgres(database, { migrationsFolder });
}

export async function migrateTestDatabase(database: PgliteDatabase<typeof schema>): Promise<void> {
  await migratePglite(database, { migrationsFolder });
}
