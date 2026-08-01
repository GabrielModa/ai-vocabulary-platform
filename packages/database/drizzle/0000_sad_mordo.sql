CREATE TABLE "platform_idempotency" (
	"actor_id" text NOT NULL,
	"operation" text NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"status" text NOT NULL,
	"safe_response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "platform_idempotency_actor_id_operation_key_pk" PRIMARY KEY("actor_id","operation","key"),
	CONSTRAINT "platform_idempotency_status_allowed" CHECK ("platform_idempotency"."status" in ('started', 'completed', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "platform_inbox" (
	"consumer" text NOT NULL,
	"message_id" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_inbox_consumer_message_id_pk" PRIMARY KEY("consumer","message_id")
);
--> statement-breakpoint
CREATE TABLE "platform_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "platform_outbox_attempt_count_nonnegative" CHECK ("platform_outbox"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX "platform_idempotency_expiry_idx" ON "platform_idempotency" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "platform_inbox_received_at_idx" ON "platform_inbox" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "platform_outbox_delivery_idx" ON "platform_outbox" USING btree ("published_at","available_at");