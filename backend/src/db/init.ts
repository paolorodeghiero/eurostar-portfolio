import { execSync } from 'child_process';
import { eq } from 'drizzle-orm';
import { db } from './index.js';
import { statuses } from './schema.js';
import { seedEssentialData } from './seed.js';

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
 * Runs database migrations using drizzle-kit push.
 * Exits process on migration failure.
 */
function runMigrations(): void {
  console.log('Running database migrations...');
  try {
    execSync('npx drizzle-kit push --force', {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
    console.log('Migrations complete.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Complete startup initialization:
 * 1. Run migrations (exits on failure)
 * 2. Ensure system statuses exist
 * 3. Seed essential referential data
 */
export async function runStartupInit(): Promise<void> {
  runMigrations();
  await ensureSystemStatuses();
  await seedEssentialData();
}
