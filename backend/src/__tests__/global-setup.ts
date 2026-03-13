import { Pool } from 'pg';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const MAX_WORKERS = 4;
const BASE_DB_NAME = 'eurostar_portfolio_test';

// Get directory of this file for relative paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendRoot = join(__dirname, '..', '..');

// Parse connection string to get base connection info
function parseConnectionString(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432'),
    user: parsed.username,
    password: parsed.password,
    protocol: parsed.protocol,
  };
}

export async function setup() {
  const baseUrl =
    process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
  const { host, port, user, password, protocol } = parseConnectionString(baseUrl);

  // Connect to postgres database (admin connection)
  const adminPool = new Pool({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  console.log('\n[Global Setup] Creating test databases for workers...');

  const createdDbs: string[] = [];

  for (let i = 1; i <= MAX_WORKERS; i++) {
    const dbName = `${BASE_DB_NAME}_${i}`;
    const workerDbUrl = `${protocol}//${user}:${password}@${host}:${port}/${dbName}`;

    try {
      // Terminate any existing connections to this database
      await adminPool.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${dbName}' AND pid <> pg_backend_pid()
      `);

      // Drop if exists (clean slate)
      await adminPool.query(`DROP DATABASE IF EXISTS ${dbName}`);

      // Create fresh database
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      createdDbs.push(dbName);

      console.log(`[Global Setup] Created database: ${dbName}`);

      // Push schema using drizzle-kit with --url flag and --force to auto-approve
      console.log(`[Global Setup] Pushing schema to ${dbName}...`);
      execSync(
        `npx drizzle-kit push --dialect=postgresql --schema=./src/db/schema.ts --url="${workerDbUrl}" --force`,
        {
          cwd: backendRoot,
          stdio: 'pipe', // Suppress output
        }
      );

      console.log(`[Global Setup] Schema pushed to ${dbName}`);
    } catch (error) {
      console.error(`[Global Setup] Failed to setup ${dbName}:`, error);
      throw error;
    }
  }

  await adminPool.end();

  console.log(`[Global Setup] Created ${createdDbs.length} test databases\n`);
}

export async function teardown() {
  const baseUrl =
    process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
  const { host, port, user, password } = parseConnectionString(baseUrl);

  const adminPool = new Pool({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  console.log('\n[Global Teardown] Dropping test databases...');

  for (let i = 1; i <= MAX_WORKERS; i++) {
    const dbName = `${BASE_DB_NAME}_${i}`;
    try {
      // Terminate any active connections
      await adminPool.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${dbName}' AND pid <> pg_backend_pid()
      `);

      await adminPool.query(`DROP DATABASE IF EXISTS ${dbName}`);
      console.log(`[Global Teardown] Dropped database: ${dbName}`);
    } catch (error) {
      console.error(`[Global Teardown] Failed to drop ${dbName}:`, error);
    }
  }

  await adminPool.end();
  console.log('[Global Teardown] Complete\n');
}
