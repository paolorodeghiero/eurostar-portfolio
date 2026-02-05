ALTER TABLE "invoices" DROP CONSTRAINT "invoices_project_id_invoice_number_amount_unique";--> statement-breakpoint
ALTER TABLE "receipts" DROP CONSTRAINT "unique_receipt";--> statement-breakpoint
ALTER TABLE "receipts" ALTER COLUMN "receipt_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "company" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "purchase_order" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "company" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "purchase_order" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_invoice_number_unique" UNIQUE("company","invoice_number");--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "unique_receipt" UNIQUE("company","receipt_number");