CREATE TABLE "vocabulary_generation_drafts" (
	"draft_id" text PRIMARY KEY NOT NULL,
	"subject_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "vocabulary_generation_drafts_expiry_after_creation" CHECK ("vocabulary_generation_drafts"."expires_at" > "vocabulary_generation_drafts"."created_at")
);
--> statement-breakpoint
CREATE INDEX "vocabulary_generation_drafts_subject_idx" ON "vocabulary_generation_drafts" USING btree ("subject_id","expires_at");--> statement-breakpoint
CREATE INDEX "vocabulary_generation_drafts_expiry_idx" ON "vocabulary_generation_drafts" USING btree ("expires_at");