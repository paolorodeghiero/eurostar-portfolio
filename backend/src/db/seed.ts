import { eq, count } from 'drizzle-orm';
import { db } from './index.js';
import {
  committeeThresholds,
  costTshirtThresholds,
  projectIdCounters,
} from './schema.js';

/**
 * Seeds essential referential data required for the application to function.
 * This runs on startup and uses upsert patterns to avoid duplicates.
 * Only seeds if tables are empty.
 */
export async function seedEssentialData(): Promise<void> {
  console.log('Checking essential referential data...');

  // Committee Thresholds
  const [committeeCount] = await db.select({ count: count() }).from(committeeThresholds);
  if (committeeCount.count === 0) {
    console.log('Seeding committee thresholds...');
    await db.insert(committeeThresholds).values([
      // EUR thresholds
      { minAmount: '0', maxAmount: '50000', level: 'not_necessary', currency: 'EUR' },
      { minAmount: '50000', maxAmount: '200000', level: 'optional', currency: 'EUR' },
      { minAmount: '200000', maxAmount: null, level: 'mandatory', currency: 'EUR' },
      // GBP thresholds (converted from EUR at ~0.85 rate)
      { minAmount: '0', maxAmount: '42500', level: 'not_necessary', currency: 'GBP' },
      { minAmount: '42500', maxAmount: '170000', level: 'optional', currency: 'GBP' },
      { minAmount: '170000', maxAmount: null, level: 'mandatory', currency: 'GBP' },
    ]);
  }

  // Cost T-shirt Thresholds
  const [costTshirtCount] = await db.select({ count: count() }).from(costTshirtThresholds);
  if (costTshirtCount.count === 0) {
    console.log('Seeding cost T-shirt thresholds...');
    await db.insert(costTshirtThresholds).values([
      { size: 'XS', maxAmount: '10000', currency: 'EUR' },
      { size: 'S', maxAmount: '50000', currency: 'EUR' },
      { size: 'M', maxAmount: '150000', currency: 'EUR' },
      { size: 'L', maxAmount: '500000', currency: 'EUR' },
      { size: 'XL', maxAmount: '1000000', currency: 'EUR' },
      { size: 'XXL', maxAmount: '999999999', currency: 'EUR' },
    ]);
  }

  // Project ID Counter for current year
  const currentYear = new Date().getFullYear();
  const [existingCounter] = await db
    .select()
    .from(projectIdCounters)
    .where(eq(projectIdCounters.year, currentYear));

  if (!existingCounter) {
    console.log(`Seeding project ID counter for year ${currentYear}...`);
    await db.insert(projectIdCounters).values([{ year: currentYear, lastId: 0 }]);
  }

  console.log('Essential data check complete.');
}
