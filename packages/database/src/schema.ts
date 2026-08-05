import { sql } from "drizzle-orm";
import type { PersistedStudySessionSnapshot } from "./study-session-types.js";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const platformOutbox = pgTable(
  "platform_outbox",
  {
    id: uuid().defaultRandom().primaryKey(),
    eventType: text("event_type").notNull(),
    payload: jsonb().notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
    availableAt: timestamp("available_at", { withTimezone: true }).defaultNow().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    attemptCount: integer("attempt_count").default(0).notNull(),
  },
  (table) => [
    check("platform_outbox_attempt_count_nonnegative", sql`${table.attemptCount} >= 0`),
    index("platform_outbox_delivery_idx").on(table.publishedAt, table.availableAt),
  ],
);

export const platformInbox = pgTable(
  "platform_inbox",
  {
    consumer: text().notNull(),
    messageId: text("message_id").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.consumer, table.messageId] }),
    index("platform_inbox_received_at_idx").on(table.receivedAt),
  ],
);

export const platformIdempotency = pgTable(
  "platform_idempotency",
  {
    actorId: text("actor_id").notNull(),
    operation: text().notNull(),
    key: text().notNull(),
    requestHash: text("request_hash").notNull(),
    status: text().notNull(),
    safeResponse: jsonb("safe_response"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.actorId, table.operation, table.key] }),
    check(
      "platform_idempotency_status_allowed",
      sql`${table.status} in ('started', 'completed', 'failed')`,
    ),
    index("platform_idempotency_expiry_idx").on(table.expiresAt),
  ],
);

export const studySessionSnapshots = pgTable(
  "study_session_snapshots",
  {
    sessionId: text("session_id").primaryKey(),
    snapshotVersion: text("snapshot_version").notNull(),
    title: text().notNull(),
    level: text().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull(),
    exerciseIds: text("exercise_ids").array().notNull(),
    snapshot: jsonb().$type<PersistedStudySessionSnapshot>().notNull(),
  },
  (table) => [
    check(
      "study_session_snapshots_version_allowed",
      sql`${table.snapshotVersion} = 'study-session-snapshot-v1'`,
    ),
    check("study_session_snapshots_exercises_nonempty", sql`cardinality(${table.exerciseIds}) > 0`),
    index("study_session_snapshots_created_at_idx").on(table.createdAt),
  ],
);

export const studySessionOwners = pgTable(
  "study_session_owners",
  {
    subjectId: text("subject_id").notNull(),
    sessionId: text("session_id").notNull(),
    linkedAt: timestamp("linked_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.subjectId, table.sessionId] }),
    foreignKey({
      columns: [table.sessionId],
      foreignColumns: [studySessionSnapshots.sessionId],
      name: "study_session_owners_session_fk",
    }).onDelete("cascade"),
    index("study_session_owners_subject_idx").on(table.subjectId),
  ],
);

export const vocabularyGenerationDrafts = pgTable(
  "vocabulary_generation_drafts",
  {
    draftId: text("draft_id").primaryKey(),
    subjectId: text("subject_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    payload: jsonb().notNull(),
  },
  (table) => [
    check(
      "vocabulary_generation_drafts_expiry_after_creation",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    index("vocabulary_generation_drafts_subject_idx").on(table.subjectId, table.expiresAt),
    index("vocabulary_generation_drafts_expiry_idx").on(table.expiresAt),
  ],
);
