import { eq, count } from 'drizzle-orm';
import { db } from './index.js';
import {
  committeeLevels,
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

  // Committee Levels (master data)
  const [levelsCount] = await db.select({ count: count() }).from(committeeLevels);
  if (levelsCount.count === 0) {
    console.log('Seeding committee levels...');
    await db.insert(committeeLevels).values([
      { name: 'not_necessary', mandatory: false, displayOrder: 1 },
      { name: 'optional', mandatory: false, displayOrder: 2 },
      { name: 'mandatory', mandatory: true, displayOrder: 3 },
    ]);
  }

  // Committee Thresholds (EUR-only, limits-based)
  const [committeeCount] = await db.select({ count: count() }).from(committeeThresholds);
  if (committeeCount.count === 0) {
    console.log('Seeding committee thresholds...');
    // Get the level IDs
    const levels = await db.select().from(committeeLevels);
    const notNecessaryId = levels.find(l => l.name === 'not_necessary')?.id;
    const optionalId = levels.find(l => l.name === 'optional')?.id;
    const mandatoryId = levels.find(l => l.name === 'mandatory')?.id;

    if (notNecessaryId && optionalId && mandatoryId) {
      await db.insert(committeeThresholds).values([
        // EUR thresholds (limits-based: amount <= maxAmount gets this level)
        // Sorted by maxAmount ascending: not_necessary, optional, mandatory
        { levelId: notNecessaryId, maxAmount: '50000' },   // 0 - 50K
        { levelId: optionalId, maxAmount: '200000' },       // 50K - 200K
        { levelId: mandatoryId, maxAmount: null },          // 200K+ (unlimited)
      ]);
    }
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
