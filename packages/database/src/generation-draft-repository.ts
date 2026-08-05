import { and, eq, gt } from "drizzle-orm";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { Database } from "./connection.js";
import { vocabularyGenerationDrafts } from "./schema.js";
import type * as databaseSchema from "./schema.js";

export interface GenerationDraftRecord {
  readonly draftId: string;
  readonly subjectId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly payload: unknown;
}

export interface GenerationDraftRepository {
  save(record: GenerationDraftRecord): Promise<{ readonly created: boolean }>;
  findActive(
    subjectId: string,
    draftId: string,
    now: Date,
  ): Promise<GenerationDraftRecord | undefined>;
}

function freezeRecord(record: GenerationDraftRecord): GenerationDraftRecord {
  return Object.freeze({ ...record });
}

export function createGenerationDraftRepository(
  database: Database | PgliteDatabase<typeof databaseSchema>,
): GenerationDraftRepository {
  const queryDatabase = database as Database;

  return {
    async save(record) {
      const inserted = await queryDatabase
        .insert(vocabularyGenerationDrafts)
        .values({
          draftId: record.draftId,
          subjectId: record.subjectId,
          createdAt: new Date(record.createdAt),
          expiresAt: new Date(record.expiresAt),
          payload: record.payload,
        })
        .onConflictDoNothing()
        .returning({ draftId: vocabularyGenerationDrafts.draftId });

      return Object.freeze({ created: inserted.length === 1 });
    },

    async findActive(subjectId, draftId, now) {
      const [row] = await queryDatabase
        .select()
        .from(vocabularyGenerationDrafts)
        .where(
          and(
            eq(vocabularyGenerationDrafts.subjectId, subjectId),
            eq(vocabularyGenerationDrafts.draftId, draftId),
            gt(vocabularyGenerationDrafts.expiresAt, now),
          ),
        )
        .limit(1);

      if (row === undefined) return undefined;

      return freezeRecord({
        draftId: row.draftId,
        subjectId: row.subjectId,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        payload: row.payload,
      });
    },
  };
}
