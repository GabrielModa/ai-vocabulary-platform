import { sql } from "drizzle-orm";
import {
  check,
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
