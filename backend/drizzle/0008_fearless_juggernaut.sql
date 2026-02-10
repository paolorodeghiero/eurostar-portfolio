ALTER TABLE "projects" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "previous_status_id" integer;--> statement-breakpoint
ALTER TABLE "statuses" ADD COLUMN "is_system_status" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "statuses" ADD COLUMN "is_read_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_previous_status_id_statuses_id_fk" FOREIGN KEY ("previous_status_id") REFERENCES "public"."statuses"("id") ON DELETE set null ON UPDATE no action;