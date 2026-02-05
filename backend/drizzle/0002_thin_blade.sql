CREATE TABLE "budget_lines" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "budget_lines_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company" varchar(10) NOT NULL,
	"department_id" integer NOT NULL,
	"cost_center_id" integer NOT NULL,
	"line_value" varchar(255) NOT NULL,
	"line_amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"type" varchar(5) NOT NULL,
	"fiscal_year" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "budget_lines_company_cost_center_id_line_value_fiscal_year_unique" UNIQUE("company","cost_center_id","line_value","fiscal_year")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoices_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"project_id" integer NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"invoice_date" date NOT NULL,
	"description" varchar(500),
	"competence_month" varchar(7),
	"competence_month_extracted" boolean DEFAULT false NOT NULL,
	"competence_month_override" varchar(7),
	"import_batch" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_project_id_invoice_number_amount_unique" UNIQUE("project_id","invoice_number","amount")
);
--> statement-breakpoint
CREATE TABLE "project_budget_allocations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "project_budget_allocations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"project_id" integer NOT NULL,
	"budget_line_id" integer NOT NULL,
	"allocation_amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_budget_allocations_project_id_budget_line_id_unique" UNIQUE("project_id","budget_line_id")
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "receipts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"project_id" integer NOT NULL,
	"receipt_number" varchar(100),
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"receipt_date" date NOT NULL,
	"description" varchar(500),
	"import_batch" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_receipt" UNIQUE NULLS NOT DISTINCT("project_id","receipt_number")
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "opex_budget" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "capex_budget" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "budget_currency" varchar(3);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cost_tshirt" varchar(5);--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_budget_allocations" ADD CONSTRAINT "project_budget_allocations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_budget_allocations" ADD CONSTRAINT "project_budget_allocations_budget_line_id_budget_lines_id_fk" FOREIGN KEY ("budget_line_id") REFERENCES "public"."budget_lines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;