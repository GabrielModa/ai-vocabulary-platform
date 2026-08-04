import { eq } from "drizzle-orm";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { Database } from "./connection.js";
import { studySessionSnapshots } from "./schema.js";
import type * as databaseSchema from "./schema.js";
import type {
  PersistedStudySessionExercise,
  PersistedStudySessionSnapshot,
} from "./study-session-types.js";

export type SaveStudySessionSnapshotResult =
  | {
      readonly ok: true;
      readonly created: boolean;
      readonly snapshot: PersistedStudySessionSnapshot;
    }
  | {
      readonly ok: false;
      readonly code: "session-id-conflict";
      readonly message: string;
    };

export interface StudySessionSnapshotRepository {
  save(snapshot: PersistedStudySessionSnapshot): Promise<SaveStudySessionSnapshotResult>;
  findById(sessionId: string): Promise<PersistedStudySessionSnapshot | undefined>;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));

    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function freezeExercise(exercise: PersistedStudySessionExercise): PersistedStudySessionExercise {
  const [answer, first, second, third] = exercise.options;
  const options: [string, string, string, string] = [answer, first, second, third];

  return Object.freeze({
    ...exercise,
    options: Object.freeze(options),
    provenance: Object.freeze({ ...exercise.provenance }),
  });
}

function freezeSnapshot(snapshot: PersistedStudySessionSnapshot): PersistedStudySessionSnapshot {
  return Object.freeze({
    ...snapshot,
    exerciseIds: Object.freeze([...snapshot.exerciseIds]),
    exercises: Object.freeze(snapshot.exercises.map(freezeExercise)),
  });
}

export function createStudySessionSnapshotRepository(
  database: Database | PgliteDatabase<typeof databaseSchema>,
): StudySessionSnapshotRepository {
  const queryDatabase = database as Database;

  async function findById(sessionId: string): Promise<PersistedStudySessionSnapshot | undefined> {
    const [row] = await queryDatabase
      .select({ snapshot: studySessionSnapshots.snapshot })
      .from(studySessionSnapshots)
      .where(eq(studySessionSnapshots.sessionId, sessionId))
      .limit(1);

    return row === undefined ? undefined : freezeSnapshot(row.snapshot);
  }

  return {
    findById,

    async save(snapshot) {
      const frozenInput = freezeSnapshot(snapshot);
      const inserted = await queryDatabase
        .insert(studySessionSnapshots)
        .values({
          sessionId: frozenInput.sessionId,
          snapshotVersion: frozenInput.snapshotVersion,
          title: frozenInput.title,
          level: frozenInput.level,
          createdAt: new Date(frozenInput.createdAt),
          exerciseIds: [...frozenInput.exerciseIds],
          snapshot: frozenInput,
        })
        .onConflictDoNothing({
          target: studySessionSnapshots.sessionId,
        })
        .returning({ sessionId: studySessionSnapshots.sessionId });

      const stored = await findById(frozenInput.sessionId);
      if (stored === undefined || canonicalJson(stored) !== canonicalJson(frozenInput)) {
        return Object.freeze({
          ok: false,
          code: "session-id-conflict",
          message: "The session ID is already associated with a different snapshot",
        });
      }

      return Object.freeze({
        ok: true,
        created: inserted.length === 1,
        snapshot: stored,
      });
    },
  };
}
