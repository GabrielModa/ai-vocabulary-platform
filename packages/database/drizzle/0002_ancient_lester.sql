CREATE TABLE "study_session_owners" (
	"subject_id" text NOT NULL,
	"session_id" text NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_session_owners_subject_id_session_id_pk" PRIMARY KEY("subject_id","session_id")
);
--> statement-breakpoint
ALTER TABLE "study_session_owners" ADD CONSTRAINT "study_session_owners_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."study_session_snapshots"("session_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "study_session_owners_subject_idx" ON "study_session_owners" USING btree ("subject_id");