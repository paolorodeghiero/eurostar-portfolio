import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';

async function dbPluginHandler(fastify: FastifyInstance): Promise<void> {
  fastify.decorate('db', db);

  // Add preHandler hook to set user context for audit triggers
  // This runs after auth plugin's preValidation, so request.user is available
  fastify.addHook('preHandler', async (request) => {
    // Only set if user is authenticated
    if (request.user?.email) {
      try {
        // Set session variable that PostgreSQL triggers can access
        // Using set_config with true makes it local to the current transaction
        await fastify.db.execute(
          sql`SELECT set_config('app.current_user_email', ${request.user.email}, true)`
        );
      } catch (err) {
        // Don't fail request if context setting fails
        fastify.log.warn({ err }, 'Failed to set audit user context');
      }
    }
  });
}

export const dbPlugin = fp(dbPluginHandler, {
  name: 'db-plugin',
});
