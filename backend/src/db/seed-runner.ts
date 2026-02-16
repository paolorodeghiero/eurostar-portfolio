import 'dotenv/config';
import { pool } from './index.js';
import { runStartupInit } from './init.js';

/**
 * Standalone script to run startup initialization.
 * Used by reset.ts after drizzle-kit push to seed essential data.
 */
async function run() {
  await runStartupInit();
  await pool.end();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
