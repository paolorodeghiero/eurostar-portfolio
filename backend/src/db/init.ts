import { eq, sql } from 'drizzle-orm';
import { db } from './index.js';
import { statuses } from './schema.js';
import { seedEssentialData } from './seed.js';
import { createReportingViews } from './reporting-views.js';

/**
 * System statuses that must always exist.
 * These are created on app startup if they don't exist.
 */
const SYSTEM_STATUSES = [
  { name: 'Draft', color: '#9CA3AF', displayOrder: 1, isSystemStatus: true, isReadOnly: false },
  { name: 'Completed', color: '#10B981', displayOrder: 100, isSystemStatus: true, isReadOnly: true },
  { name: 'Stopped', color: '#DC2626', displayOrder: 101, isSystemStatus: true, isReadOnly: true },
];

/**
 * Ensures system statuses exist in the database.
 * Called on app startup - uses upsert to avoid duplicates.
 */
export async function ensureSystemStatuses(): Promise<void> {
  for (const status of SYSTEM_STATUSES) {
    // Check if status exists by name
    const [existing] = await db
      .select()
      .from(statuses)
      .where(eq(statuses.name, status.name));

    if (!existing) {
      // Create if doesn't exist
      await db.insert(statuses).values(status);
      console.log(`Created system status: ${status.name}`);
    } else if (!existing.isSystemStatus) {
      // Update to system status if exists but not marked as system
      await db
        .update(statuses)
        .set({ isSystemStatus: status.isSystemStatus, isReadOnly: status.isReadOnly })
        .where(eq(statuses.id, existing.id));
      console.log(`Updated ${status.name} to system status`);
    }
  }
}

/**
 * Checks if essential database tables exist.
 * Exits with helpful message if schema is missing.
 */
async function checkSchemaExists(): Promise<void> {
  console.log('Checking database schema...');
  try {
    // Try to query a core table - if it fails, schema isn't set up
    await db.execute(sql`SELECT 1 FROM statuses LIMIT 1`);
    console.log('Schema verified.');
  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      console.error('\n❌ Database schema not found!');
      console.error('Run "make db-push" to create the schema, then restart the server.\n');
      process.exit(1);
    }
    // Other errors - let them propagate
    throw error;
  }
}

/**
 * Complete startup initialization:
 * 1. Check schema is in sync (exits if not)
 * 2. Ensure system statuses exist
 * 3. Seed essential referential data
 * 4. Create/update reporting views
 *
 * NOTE: Migrations must be run separately via "make db-push" before starting the server.
 */
export async function runStartupInit(): Promise<void> {
  await checkSchemaExists();
  await ensureSystemStatuses();
  await seedEssentialData();

  // Create/update reporting views
  console.log('Creating/updating reporting views...');
  try {
    await createReportingViews(db);
    console.log('Reporting views created/updated successfully.');
  } catch (error) {
    console.error('Failed to create reporting views:', error);
    throw error;
  }
}
