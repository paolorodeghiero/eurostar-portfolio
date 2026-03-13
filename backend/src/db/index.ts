import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

// Connection pool configuration - keyed by URL to support multiple databases
const pools = new Map<string, Pool>();
const dbInstances = new Map<string, NodePgDatabase<typeof schema>>();

/**
 * Get or create the database instance for the current DATABASE_URL.
 * Supports multiple concurrent database connections (important for parallel tests).
 */
export function getDb(): NodePgDatabase<typeof schema> {
  const dbUrl =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/eurostar_portfolio';

  // Return existing instance for this URL if available
  let instance = dbInstances.get(dbUrl);
  if (instance) {
    return instance;
  }

  // Create new pool and instance for this URL
  const pool = new Pool({
    connectionString: dbUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  instance = drizzle(pool, { schema });
  pools.set(dbUrl, pool);
  dbInstances.set(dbUrl, instance);

  return instance;
}

// Legacy export for backwards compatibility - calls getDb() on access
// This ensures current DATABASE_URL is always used
export const db = {
  get select() {
    return getDb().select.bind(getDb());
  },
  get insert() {
    return getDb().insert.bind(getDb());
  },
  get update() {
    return getDb().update.bind(getDb());
  },
  get delete() {
    return getDb().delete.bind(getDb());
  },
  get execute() {
    return getDb().execute.bind(getDb());
  },
  get query() {
    return getDb().query;
  },
  get transaction() {
    return getDb().transaction.bind(getDb());
  },
  get $with() {
    return getDb().$with.bind(getDb());
  },
};

// Export pool getter for lifecycle management
export function getPool(): Pool | null {
  const dbUrl =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/eurostar_portfolio';
  return pools.get(dbUrl) || null;
}

// Export function to close all pools (for test cleanup)
export async function closeAllPools(): Promise<void> {
  const closePromises: Promise<void>[] = [];
  for (const pool of pools.values()) {
    closePromises.push(pool.end());
  }
  await Promise.all(closePromises);
  pools.clear();
  dbInstances.clear();
}

// Export schema for use in other modules
export * from './schema.js';
