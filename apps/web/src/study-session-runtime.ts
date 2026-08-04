import type { SessionIdentityPort } from "@vocabulary/auth";
import {
  createDatabaseConnection,
  createStudySessionOwnershipRepository,
  createStudySessionSnapshotRepository,
  type DatabaseConnection,
} from "@vocabulary/database/runtime";
import {
  createOwnedStudySessionApplication,
  createStudySessionApplication,
} from "@vocabulary/domain-vocabulary";
import {
  createStudySessionHttpHandlers,
  type StudySessionDraftPort,
} from "../app/api/study-sessions/http";

export interface StudySessionRuntimeAdapters {
  readonly identity: SessionIdentityPort<Headers>;
  readonly drafts: StudySessionDraftPort;
}

export interface StudySessionRuntimeOptions extends StudySessionRuntimeAdapters {
  readonly databaseUrl: string;
  readonly connection?: DatabaseConnection;
}

export interface StudySessionRuntime {
  readonly handlers: ReturnType<typeof createStudySessionHttpHandlers>;
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
  drafts,
  identity,
}: StudySessionRuntimeOptions): StudySessionRuntime {
  const connection =
    suppliedConnection ??
    createDatabaseConnection({
      url: normalizedDatabaseUrl(databaseUrl),
      maxConnections: 5,
    });

  const snapshots = createStudySessionSnapshotRepository(connection.database);
  const ownership = createStudySessionOwnershipRepository(connection.database);
  const sessions = createStudySessionApplication(snapshots);
  const application = createOwnedStudySessionApplication(sessions, ownership);

  return Object.freeze({
    handlers: createStudySessionHttpHandlers({
      identity,
      drafts,
      application,
    }),
    close: suppliedConnection ? () => Promise.resolve() : () => connection.close(),
  });
}
