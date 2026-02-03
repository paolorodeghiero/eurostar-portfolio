import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { projectIdCounters } from '../db/schema.js';

/**
 * Generates a unique project ID in the format PRJ-YYYY-00001
 *
 * Uses an atomic upsert operation to ensure unique IDs even under concurrent access.
 * The counter is incremented per year, resetting to 1 each new year.
 *
 * @returns Promise<string> - Project ID in format PRJ-YYYY-NNNNN
 */
export async function generateProjectId(): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Atomic upsert: insert if not exists, increment if exists
  // Uses PostgreSQL ON CONFLICT ... DO UPDATE for atomicity
  const result = await db
    .insert(projectIdCounters)
    .values({ year: currentYear, lastId: 1 })
    .onConflictDoUpdate({
      target: projectIdCounters.year,
      set: { lastId: sql`${projectIdCounters.lastId} + 1` },
    })
    .returning({ lastId: projectIdCounters.lastId });

  const nextId = result[0].lastId;

  // Format: PRJ-YYYY-00001 (5-digit padding)
  const paddedId = String(nextId).padStart(5, '0');
  return `PRJ-${currentYear}-${paddedId}`;
}
