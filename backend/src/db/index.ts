import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

// Connection pool configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/eurostar_portfolio';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Export pool for lifecycle management
export { pool };

// Export schema for use in other modules
export * from './schema.js';
