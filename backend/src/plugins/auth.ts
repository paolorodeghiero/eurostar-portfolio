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

      // Debug: Log hook entry
      fastify.log.info({ url: request.url, isDev: config.isDev }, 'Auth hook entered');

      // Dev mode bypass
      if (config.isDev) {
        fastify.log.info('Using dev mode bypass');
        request.user = getDevUser();
        return;
      }

      // Extract Bearer token
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        fastify.log.warn({
          url: request.url,
          hasAuthHeader: !!authHeader,
          authHeaderStart: authHeader ? authHeader.substring(0, 20) : 'none',
        }, 'Missing or invalid authorization header');
        return reply
          .code(401)
          .send({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.substring(7);

      // Debug: Log token info (first/last chars only for security)
      fastify.log.info({
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + '...',
        isDev: config.isDev,
      }, 'Auth attempt');

      try {
        const decoded = await validateToken(token);
        fastify.log.info({ oid: decoded.oid, email: decoded.email }, 'Token validated successfully');

        // Check admin group membership
        // Special case: '*' means all authenticated users are admins (for testing)
        const groups = decoded.groups || [];
        const isAdmin = config.auth.adminGroupId === '*' || groups.includes(config.auth.adminGroupId);

        fastify.log.info({
          groupCount: groups.length,
          adminGroupId: config.auth.adminGroupId,
          isAdmin,
        }, 'Admin role check');

        request.user = {
          id: decoded.oid,
          email: decoded.email || decoded.preferred_username || 'unknown',
          name: decoded.name,
          role: isAdmin ? 'admin' : 'user',
        };
      } catch (err) {
        // Log the full error details
        fastify.log.error({
          errorName: (err as Error).name,
          errorMessage: (err as Error).message,
          errorStack: (err as Error).stack,
        }, 'Token validation failed');
        return reply.code(401).send({ error: 'Invalid token' });
      }
    }
  );
}

export const authPlugin = fp(authPluginHandler, {
  name: 'auth-plugin',
});
