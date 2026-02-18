import { config } from 'dotenv';
import { beforeAll } from 'vitest';
import { build } from '../app.js';

// Load test environment variables
config({ path: './test.env' });

// Verify TEST_DATABASE_URL is set
beforeAll(() => {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL must be set in test.env');
  }
});

// Placeholder for database reset/seed utilities (to be added in Plan 02)
// export async function resetDatabase() { ... }
// export async function seedTestData() { ... }

// Helper to get a test app instance
// Note: TEST_DATABASE_URL must be set in environment before calling
export async function getTestApp() {
  return build({
    logger: false,
  });
}
