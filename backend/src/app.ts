import Fastify, { FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { config } from './config/index.js';
import { dbPlugin } from './plugins/db.js';
import { authPlugin } from './plugins/auth.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { referentialsRoutes } from './routes/admin/referentials.js';
import { projectsRouter } from './routes/projects/index.js';
import { actualsRouter } from './routes/actuals/index.js';
import { alertsPlugin } from './routes/alerts/index.js';

export type BuildOptions = FastifyServerOptions;

export async function build(opts: BuildOptions = {}) {
  const fastify = Fastify(opts);

  // Register CORS
  await fastify.register(cors, {
    origin: config.frontend.url,
    credentials: true,
  });

  // Register multipart for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
      files: 1, // Only one file at a time
    },
  });

  // Register static file serving (for file downloads)
  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    serve: false, // We serve files via authenticated routes
  });

  // Register database plugin
  // Note: Test database URL should be set via TEST_DATABASE_URL env var before building
  await fastify.register(dbPlugin);

  // Register authentication plugin
  await fastify.register(authPlugin);

  // Register Swagger plugin (after auth, before routes for route discovery)
  await fastify.register(swaggerPlugin);

  // Health check endpoint (skips auth)
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });

  // Current user endpoint
  fastify.get('/api/me', async (request) => {
    return request.user;
  });

  // Register admin routes
  await fastify.register(referentialsRoutes, { prefix: '/api/admin' });

  // Register projects routes
  await fastify.register(projectsRouter, { prefix: '/api' });

  // Register actuals routes
  await fastify.register(actualsRouter, { prefix: '/api' });

  // Register alerts routes
  await fastify.register(alertsPlugin, { prefix: '/api' });

  return fastify;
}
