import type { SessionIdentityPort } from "@vocabulary/auth";
import {
  createDatabaseConnection,
  createGenerationDraftRepository,
  createStudySessionOwnershipRepository,
  createStudySessionSnapshotRepository,
  type DatabaseConnection,
} from "@vocabulary/database/runtime";
import {
  createOwnedStudySessionApplication,
  createStudySessionApplication,
} from "@vocabulary/domain-vocabulary";
import { createStudySessionAnswerHandler } from "../app/api/study-sessions/answer-http";
import { createStudySessionHttpHandlers } from "../app/api/study-sessions/http";
import {
  createPersistentStudySessionDrafts,
  type PersistentStudySessionDrafts,
} from "./study-session-drafts";

export interface StudySessionRuntimeAdapters {
  readonly identity: SessionIdentityPort<Headers>;
  readonly drafts?: PersistentStudySessionDrafts;
}

export interface StudySessionRuntimeOptions extends StudySessionRuntimeAdapters {
  readonly databaseUrl: string;
  readonly connection?: DatabaseConnection;
}

export interface StudySessionRuntime {
  readonly identity: SessionIdentityPort<Headers>;
  readonly drafts: PersistentStudySessionDrafts;
  readonly handlers: ReturnType<typeof createStudySessionHttpHandlers>;
  readonly answers: ReturnType<typeof createStudySessionAnswerHandler>;
  close(): Promise<void>;
}

function normalizedDatabaseUrl(value: string): string {
  const normalized = value.normalize("NFKC").trim();
  if (!normalized) {
    throw new Error("DATABASE_URL is required for the study-session runtime");
  }
  return normalized;
}

export function createStudySessionRuntime({
  connection: suppliedConnection,
  databaseUrl,
  drafts: suppliedDrafts,
  identity,
}: StudySessionRuntimeOptions): StudySessionRuntime {
  const connection =
    suppliedConnection ??
    createDatabaseConnection({
      url: normalizedDatabaseUrl(databaseUrl),
      maxConnections: 5,
    });

  const drafts =
    suppliedDrafts ??
    createPersistentStudySessionDrafts(createGenerationDraftRepository(connection.database));
  const snapshots = createStudySessionSnapshotRepository(connection.database);
  const ownership = createStudySessionOwnershipRepository(connection.database);
  const sessions = createStudySessionApplication(snapshots);
  const application = createOwnedStudySessionApplication(sessions, ownership);

  return Object.freeze({
    identity,
    drafts,
    handlers: createStudySessionHttpHandlers({
      identity,
      drafts,
      application,
    }),
    answers: createStudySessionAnswerHandler({
      identity,
      application,
    }),
    close: suppliedConnection ? () => Promise.resolve() : () => connection.close(),
  });
}
