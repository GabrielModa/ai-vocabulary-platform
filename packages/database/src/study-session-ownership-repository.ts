import { and, eq } from "drizzle-orm";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { Database } from "./connection.js";
import { studySessionOwners } from "./schema.js";
import type * as databaseSchema from "./schema.js";

export interface StudySessionOwnershipRepository {
  bind(subjectId: string, sessionId: string): Promise<{ readonly created: boolean }>;
  owns(subjectId: string, sessionId: string): Promise<boolean>;
}

export function createStudySessionOwnershipRepository(
  database: Database | PgliteDatabase<typeof databaseSchema>,
): StudySessionOwnershipRepository {
  const queryDatabase = database as Database;

  return {
    async bind(subjectId, sessionId) {
      const inserted = await queryDatabase
        .insert(studySessionOwners)
        .values({ subjectId, sessionId })
        .onConflictDoNothing()
        .returning({ sessionId: studySessionOwners.sessionId });

      return Object.freeze({ created: inserted.length === 1 });
    },

    async owns(subjectId, sessionId) {
      const [row] = await queryDatabase
        .select({ sessionId: studySessionOwners.sessionId })
        .from(studySessionOwners)
        .where(
          and(
            eq(studySessionOwners.subjectId, subjectId),
            eq(studySessionOwners.sessionId, sessionId),
          ),
        )
        .limit(1);

      return row !== undefined;
    },
  };
}
