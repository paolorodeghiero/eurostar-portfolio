import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, asc, sql } from 'drizzle-orm';
import { costTshirtThresholds } from '../db/schema.js';

/**
 * Derives cost T-shirt size based on total budget and currency.
 *
 * @param db - Drizzle database instance
 * @param totalBudget - Total budget amount as string (e.g., "150000.00")
 * @param currency - ISO 4217 currency code (e.g., "EUR", "GBP")
 * @returns T-shirt size (XS, S, M, L, XL, XXL) or null if no thresholds exist for currency
 */
export async function deriveCostTshirt(
  db: NodePgDatabase<Record<string, never>>,
  totalBudget: string,
  currency: string
): Promise<string | null> {
  // Query thresholds for matching currency, ordered by maxAmount ascending
  const thresholds = await db
    .select({
      size: costTshirtThresholds.size,
      maxAmount: costTshirtThresholds.maxAmount,
    })
    .from(costTshirtThresholds)
    .where(eq(costTshirtThresholds.currency, currency))
    .orderBy(asc(costTshirtThresholds.maxAmount));

  // If no thresholds exist for currency, return null
  if (thresholds.length === 0) {
    return null;
  }

  // Find first threshold where totalBudget <= maxAmount
  // Use string comparison with PostgreSQL's CAST to avoid JavaScript Number precision issues
  for (const threshold of thresholds) {
    // Compare as numeric values
    if (parseFloat(totalBudget) <= parseFloat(threshold.maxAmount)) {
      return threshold.size;
    }
  }

  // If budget exceeds all thresholds, return the last size (XXL)
  return thresholds[thresholds.length - 1].size;
}
