-- Refactor committee thresholds to EUR-only limits structure
DELETE FROM "committee_thresholds";--> statement-breakpoint
ALTER TABLE "committee_thresholds" DROP COLUMN "min_amount";--> statement-breakpoint
ALTER TABLE "committee_thresholds" DROP COLUMN "currency";