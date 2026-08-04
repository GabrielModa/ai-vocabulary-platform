CREATE TABLE "study_session_snapshots" (
	"session_id" text PRIMARY KEY NOT NULL,
	"snapshot_version" text NOT NULL,
	"title" text NOT NULL,
	"level" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"exercise_ids" text[] NOT NULL,
	"snapshot" jsonb NOT NULL,
	CONSTRAINT "study_session_snapshots_version_allowed" CHECK ("study_session_snapshots"."snapshot_version" = 'study-session-snapshot-v1'),
	CONSTRAINT "study_session_snapshots_exercises_nonempty" CHECK (cardinality("study_session_snapshots"."exercise_ids") > 0)
);
--> statement-breakpoint
CREATE INDEX "study_session_snapshots_created_at_idx" ON "study_session_snapshots" USING btree ("created_at");