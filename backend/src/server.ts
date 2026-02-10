import Fastify from 'fastify';
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
import { runStartupInit } from './db/init.js';

const fastify = Fastify({ logger: true });

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
await fastify.register(dbPlugin);

// Run startup initialization (migrations + system data)
await runStartupInit();

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

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    fastify.log.info(`Server running on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
