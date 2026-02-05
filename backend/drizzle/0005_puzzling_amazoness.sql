ALTER TABLE "invoices" DROP CONSTRAINT "invoices_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;