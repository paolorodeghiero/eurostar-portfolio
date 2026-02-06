CREATE TABLE "alert_config" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "alert_config_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" varchar(50) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"budget_threshold_percent" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alert_config_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"table_name" varchar(100) NOT NULL,
	"record_id" integer NOT NULL,
	"changed_by" varchar(255) NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"operation" varchar(10) NOT NULL,
	"changes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
