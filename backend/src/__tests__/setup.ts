import { config } from 'dotenv';
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { build } from '../app.js';
import { seedTestData, clearTestData } from './fixtures/index.js';
import * as schema from '../db/schema.js';

// Load test environment variables
config({ path: './test.env' });

const BASE_DB_NAME = 'eurostar_portfolio_test';

/**
 * Get the worker-specific database URL
 * Each Vitest worker gets its own isolated database
 */
function getWorkerDatabaseUrl(): string {
  const baseUrl =
    process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

  // Vitest provides VITEST_POOL_ID for worker identification
  const workerId = process.env.VITEST_POOL_ID || '1';

  // Parse and reconstruct URL with worker-specific database
  const url = new URL(baseUrl);
  const workerDbName = `${BASE_DB_NAME}_${workerId}`;
  url.pathname = `/${workerDbName}`;

  return url.toString();
}

// Verify TEST_DATABASE_URL is set
beforeAll(() => {
  if (!process.env.TEST_DATABASE_URL) {
    console.warn('TEST_DATABASE_URL not set, using default localhost connection');
  }
});

// Global test database pool and instance (per-worker)
let globalTestPool: Pool | null = null;
let globalTestDb: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create a test database instance for this worker
 */
export function getTestDb() {
  if (!globalTestDb) {
    const dbUrl = getWorkerDatabaseUrl();
    globalTestPool = new Pool({
      connectionString: dbUrl,
      max: 5, // Small pool for tests
    });
    globalTestDb = drizzle(globalTestPool, { schema });

    // Log which database this worker is using
    const workerId = process.env.VITEST_POOL_ID || '1';
    console.log(`[Worker ${workerId}] Using database: ${BASE_DB_NAME}_${workerId}`);
  }
  return globalTestDb;
}

/**
 * Get a test app instance with worker-specific test database
 */
export async function getTestApp() {
  // Override DATABASE_URL to use worker-specific test database
  const originalDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = getWorkerDatabaseUrl();

  const app = await build({
    logger: false,
  });

  // Restore original DATABASE_URL
  process.env.DATABASE_URL = originalDbUrl;

  return app;
}

/**
 * Setup helper for tests that need fresh data
 * Call this in beforeEach to get isolated test data
 */
export async function setupTestData() {
  const db = getTestDb();
  await clearTestData(db);
  return await seedTestData(db);
}

/**
 * Cleanup helper for tests
 * Call this in afterEach to clean up test data
 */
export async function cleanupTestData() {
  const db = getTestDb();
  await clearTestData(db);
}

// Clean up database connections after all tests complete
afterAll(async () => {
  if (globalTestPool) {
    await globalTestPool.end();
    globalTestPool = null;
    globalTestDb = null;
  }
});

// Re-export fixture utilities for convenience
export { seedTestData, clearTestData, createTestProject } from './fixtures/index.js';
