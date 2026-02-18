import { config } from 'dotenv';
import { beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { build } from '../app.js';
import { seedTestData, clearTestData } from './fixtures/index.js';
import * as schema from '../db/schema.js';

// Load test environment variables
config({ path: './test.env' });

// Verify TEST_DATABASE_URL is set
beforeAll(() => {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL must be set in test.env');
  }
});

// Global test database pool and instance (shared across tests)
let globalTestPool: Pool | null = null;
let globalTestDb: any = null;

/**
 * Get or create a test database instance
 */
export function getTestDb() {
  if (!globalTestDb) {
    globalTestPool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      max: 5, // Small pool for tests
    });
    globalTestDb = drizzle(globalTestPool, { schema });
  }
  return globalTestDb;
}

/**
 * Get a test app instance with test database
 */
export async function getTestApp() {
  // Override DATABASE_URL to use test database
  const originalDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

  const app = await build({
    logger: false,
  });

  // Restore original DATABASE_URL
  process.env.DATABASE_URL = originalDbUrl;

  return app;
}

// Clean up database connections after all tests complete
afterAll(async () => {
  if (globalTestPool) {
    await globalTestPool.end();
  }
});

// Re-export fixture utilities for convenience
export { seedTestData, clearTestData, createTestProject } from './fixtures/index.js';
