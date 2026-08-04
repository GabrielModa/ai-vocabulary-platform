export {
  createDatabaseConnection,
  type Database,
  type DatabaseConnection,
  type DatabaseConnectionOptions,
} from "./connection.js";
export { DatabaseHealthAdapter, type DatabaseHealth, type HealthQueryExecutor } from "./health.js";
export { migrateDatabase, migrationsFolder } from "./migrations.js";
export {
  createTransactionPort,
  type DatabaseTransaction,
  type TransactionPort,
} from "./transaction.js";

export {
  createStudySessionSnapshotRepository,
  type SaveStudySessionSnapshotResult,
  type StudySessionSnapshotRepository,
} from "./study-session-repository.js";
export type {
  PersistedStudySessionExercise,
  PersistedStudySessionSnapshot,
} from "./study-session-types.js";
export {
  createStudySessionOwnershipRepository,
  type StudySessionOwnershipRepository,
} from "./study-session-ownership-repository.js";
