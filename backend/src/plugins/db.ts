import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';

async function dbPluginHandler(fastify: FastifyInstance): Promise<void> {
  // Use getDb() to ensure we get a connection for the current DATABASE_URL
  // This is important for tests which change DATABASE_URL per worker
  fastify.decorate('db', getDb());

  // Add preHandler hook to set user context for audit triggers
  // This runs after auth plugin's preValidation, so request.user is available
  fastify.addHook('preHandler', async (request) => {
    try {
      // Set session variable that PostgreSQL triggers can access
      // Using set_config with false makes it session-level (persists for connection)
      // Always set a value - use 'dev-user' for unauthenticated requests in dev mode
      const userEmail = request.user?.email || 'dev-user';
      await fastify.db.execute(
        sql`SELECT set_config('app.current_user_email', ${userEmail}, false)`
      );
    } catch (err) {
      // Don't fail request if context setting fails
      fastify.log.warn({ err }, 'Failed to set audit user context');
    }
  });
}

export const dbPlugin = fp(dbPluginHandler, {
  name: 'db-plugin',
});
