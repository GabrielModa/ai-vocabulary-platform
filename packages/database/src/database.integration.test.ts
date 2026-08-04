import { count, eq, sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { migrateTestDatabase } from "./migrations.js";
import { platformInbox } from "./schema.js";
import { createTestDatabase, type TestDatabase } from "./testing.js";

const databases: TestDatabase[] = [];

async function isolatedDatabase(): Promise<TestDatabase> {
  const instance = await createTestDatabase();
  databases.push(instance);
  return instance;
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map(async (instance) => instance.close()));
});

describe("PostgreSQL migration foundation", () => {
  it(
    "connects and migrates repeatedly without duplicate effects",
    { timeout: 20_000 },
    async () => {
      const instance = await isolatedDatabase();

      await expect(instance.database.execute(sql`select 1 as connected`)).resolves.toBeDefined();
      await expect(migrateTestDatabase(instance.database)).resolves.toBeUndefined();
      await expect(migrateTestDatabase(instance.database)).resolves.toBeUndefined();

      const tables = await instance.client.query<{ table_schema: string; table_name: string }>(
        "select table_schema, table_name from information_schema.tables where table_schema in ('drizzle', 'public') order by table_schema, table_name",
      );
      expect(tables.rows.map((row) => `${row.table_schema}.${row.table_name}`)).toEqual([
        "drizzle.__drizzle_migrations",
        "public.platform_idempotency",
        "public.platform_inbox",
        "public.platform_outbox",
      ]);
    },
  );

  it("rolls back all writes when a transaction fails", { timeout: 20_000 }, async () => {
    const { database } = await isolatedDatabase();

    await expect(
      database.transaction(async (transaction) => {
        await transaction.insert(platformInbox).values({
          consumer: "test-consumer",
          messageId: "message-1",
        });
        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");

    const [result] = await database.select({ value: count() }).from(platformInbox);
    expect(result?.value).toBe(0);
  });

  it("resets data and isolates independent test databases", { timeout: 20_000 }, async () => {
    const first = await isolatedDatabase();
    const second = await isolatedDatabase();
    await first.database.insert(platformInbox).values({
      consumer: "test-consumer",
      messageId: "isolated-message",
    });

    const firstRows = await first.database
      .select()
      .from(platformInbox)
      .where(eq(platformInbox.messageId, "isolated-message"));
    const secondRows = await second.database.select().from(platformInbox);
    expect(firstRows).toHaveLength(1);
    expect(secondRows).toHaveLength(0);

    await first.reset();
    await expect(first.database.select().from(platformInbox)).resolves.toHaveLength(0);
  });
});
