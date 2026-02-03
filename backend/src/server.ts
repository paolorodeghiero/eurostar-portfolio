import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/index.js';
import { authPlugin } from './plugins/auth.js';

const fastify = Fastify({ logger: true });

// Register CORS
await fastify.register(cors, {
  origin: config.frontend.url,
  credentials: true,
});

// Register authentication plugin
await fastify.register(authPlugin);

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
