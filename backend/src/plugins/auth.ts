import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/index.js';
import { validateToken } from '../lib/jwt-validator.js';
import { getDevUser } from './dev-mode.js';

async function authPluginHandler(fastify: FastifyInstance): Promise<void> {
  fastify.addHook(
    'preValidation',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Skip auth for health endpoint
      if (request.url === '/health') {
        return;
      }

      // Dev mode bypass
      if (config.isDev) {
        request.user = getDevUser();
        return;
      }

      // Extract Bearer token
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply
          .code(401)
          .send({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.substring(7);

      try {
        const decoded = await validateToken(token);

        // Check admin group membership
        const groups = decoded.groups || [];
        const isAdmin = groups.includes(config.auth.adminGroupId);

        request.user = {
          id: decoded.oid,
          email: decoded.email || decoded.preferred_username || 'unknown',
          name: decoded.name,
          role: isAdmin ? 'admin' : 'user',
        };
      } catch (err) {
        fastify.log.error(err, 'Token validation failed');
        return reply.code(401).send({ error: 'Invalid token' });
      }
    }
  );
}

export const authPlugin = fp(authPluginHandler, {
  name: 'auth-plugin',
});
